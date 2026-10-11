const b64 = "AXNvdXJjZV91cmwgZG9tYWluIG5vdCBpbiBhdXRob3JpemVkIGFsbG93bGlzdA==";
const buf = Buffer.from(b64, 'base64');
console.log("Raw hex:", buf.toString('hex'));
console.log("String sliced(1):", buf.slice(1).toString('utf8'));
