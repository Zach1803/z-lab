// Minimal MQTT 3.1.1 over secure WebSocket, used as a presence relay for the mall.
// Connects to several public brokers at once; every message carries a sender id and sequence
// number so duplicates arriving via different brokers are dropped.
const enc = new TextEncoder(), dec = new TextDecoder();
const str = (s) => { const b = enc.encode(s); return [b.length >> 8, b.length & 255, ...b]; };
const varLen = (n) => { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; o.push(d); } while (n > 0); return o; };
const pkt = (type, body) => new Uint8Array([type, ...varLen(body.length), ...body]);

class Broker {
  constructor(url, topic, id, will, onMsg, onState) {
    Object.assign(this, { url, topic, id, will, onMsg, onState, ok: false, buf: new Uint8Array(0), tries: 0, dead: false });
    this.open();
  }
  open() {
    if (this.dead) return;
    let ws; try { ws = new WebSocket(this.url, 'mqtt'); } catch (e) { return this.retry(); }
    ws.binaryType = 'arraybuffer'; this.ws = ws;
    ws.onopen = () => {
      const flags = 0x02 | 0x04; // clean session + will
      const body = [...str('MQTT'), 4, flags, 0, 45, ...str(this.id + '-' + Math.random().toString(36).slice(2, 6)), ...str(this.topic), ...str(this.will)];
      ws.send(pkt(0x10, body));
    };
    ws.onmessage = (e) => { const a = new Uint8Array(e.data), b = new Uint8Array(this.buf.length + a.length); b.set(this.buf); b.set(a, this.buf.length); this.buf = b; this.parse(); };
    ws.onclose = ws.onerror = () => { if (this.ws !== ws) return; this.ws = null; if (this.ok) { this.ok = false; this.onState(); } clearInterval(this.ping); this.retry(); };
  }
  retry() { if (this.dead) return; this.tries++; setTimeout(() => this.open(), Math.min(15000, 1000 * this.tries)); }
  parse() {
    for (;;) {
      const b = this.buf; if (b.length < 2) return;
      let len = 0, mul = 1, i = 1, byte;
      do { if (i >= b.length) return; byte = b[i++]; len += (byte & 127) * mul; mul *= 128; } while (byte & 128);
      if (b.length < i + len) return;
      const type = b[0] >> 4, body = b.subarray(i, i + len); this.buf = b.slice(i + len);
      if (type === 2) { // CONNACK
        if (body[1] !== 0) { this.ws && this.ws.close(); return; }
        this.ws.send(pkt(0x82, [0, 1, ...str(this.topic), 0]));
        this.ok = true; this.tries = 0; this.onState();
        clearInterval(this.ping); this.ping = setInterval(() => { try { this.ws && this.ws.send(new Uint8Array([0xc0, 0])); } catch (e) {} }, 20000);
      } else if (type === 3) { // PUBLISH (QoS 0)
        const tl = (body[0] << 8) | body[1], qos = (b[0] >> 1) & 3, off = 2 + tl + (qos ? 2 : 0);
        if (body.length - off > 2048) continue;
        try { this.onMsg(dec.decode(body.subarray(off))); } catch (e) {}
      }
    }
  }
  send(s) { if (!this.ok || !this.ws) return; try { this.ws.send(pkt(0x30, [...str(this.topic), ...enc.encode(s)])); } catch (e) {} }
  close() { this.dead = true; try { this.ws && this.ws.close(); } catch (e) {} clearInterval(this.ping); }
}

export const BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];

export function joinRelay({ topic, id, onMsg, onStatus, brokers = BROKERS }) {
  let seq = 0; const last = new Map();
  const bye = JSON.stringify({ i: id, n: 1e15, t: 'bye' });
  const handle = (raw) => {
    if (raw.length > 2048) return; let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m.i !== 'string' || m.i === id || m.i.length > 40) return;
    const n = +m.n || 0, prev = last.get(m.i) || 0;
    if (m.t !== 'bye' && n <= prev) return; // duplicate from a second broker
    last.set(m.i, m.t === 'bye' ? 0 : n);
    onMsg(m);
  };
  const list = brokers.map((u) => new Broker(u, topic, id, bye, handle, () => onStatus(list.filter((b) => b.ok).length)));
  return {
    send(t, d) { const s = JSON.stringify({ i: id, n: ++seq, t, d }); list.forEach((b) => b.send(s)); },
    leave() { list.forEach((b) => b.send(bye)); list.forEach((b) => b.close()); },
    connected: () => list.filter((b) => b.ok).length
  };
}
