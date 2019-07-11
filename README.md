# JavaScript Protobuf

[**DEMO**](https://tomashubelbauer.github.io/js-protobuf)

A JavaScript library for decoding the ProtocolBuffers wire format
(without a schema).
**This is work in progress.**

This library is tested on a Prague OSM extract file by BBBike.org:
https://download.bbbike.org/osm/bbbike/Prag/

It is validated against https://protogen.marcgravell.com/decode

The ProtoBuf wire format is documented at:
https://developers.google.com/protocol-buffers/docs/encoding

To run it locally, run it using `npx serve .` as it uses `fetch` to get the PBF
file which doesn't work off the `file://` protocol in Chrome (does in Firefox).

---

- Recognize strings whose embedded content is just the same string
  (length diff = length varint byte length) and discard embedded content then
