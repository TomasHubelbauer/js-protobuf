# JavaScript Protobuf

A JavaScript library for decoding the ProtocolBuffers wire format (without a
schema). **This is work in progress.**

This library is tested on Qwant vector tiles which are based on OSM data.

- Qwant Maps (beta): https://www.qwant.com/maps
- .NET ProtoBuf decoder: https://protogen.marcgravell.com/decode
- Online hex editor: https://www.onlinehexeditor.com
- ProtoBuf wire format: https://developers.google.com/protocol-buffers/docs/encoding

---

- Add support for embedded messages so that the first string (320 bytes) and the
  fourth string (6 bytes, `beer`) work as expected
- Debug the .NET library to see how it recognizes the first string is an embedded
  message and knows to construct the hierarchy
- Publish to GitHub Pages and add a GitHub Pages demo bookmark to the README
