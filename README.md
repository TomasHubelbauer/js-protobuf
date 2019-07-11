# JavaScript Protobuf

A JavaScript library for decoding the ProtocolBuffers wire format (without a
schema). **This is work in progress.**

This library is tested on Qwant vector tiles which are based on OSM data.

- Qwant Maps (beta): https://www.qwant.com/maps
- .NET ProtoBuf decoder: https://protogen.marcgravell.com/decode
- Online hex editor: https://www.onlinehexeditor.com
- ProtoBuf wire format: https://developers.google.com/protocol-buffers/docs/encoding

---

- Test string messages for being embedded protobuf so that the first string (320 bytes)
  and the fourth string (6 bytes, `beer`) work as expected
- Publish to GitHub Pages and add a GitHub Pages demo bookmark to the README
