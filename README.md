# JavaScript Protobuf

[**DEMO**](https://tomashubelbauer.github.io/js-protobuf)

A JavaScript library for decoding the ProtocolBuffers wire format
(with or without a schema).
**This is work in progress.**

This library is tested on a Prague OSM extract file by BBBike.org:
https://download.bbbike.org/osm/bbbike/Prag/

It is validated against https://protogen.marcgravell.com/decode

The ProtoBuf wire format is documented at:
https://developers.google.com/protocol-buffers/docs/encoding

To run it locally, run it using `npx serve .` as it uses `fetch` to get the PBF
file which doesn't work off the `file://` protocol in Chrome (does in Firefox).

## To-Do

### Recognize strings whose embedded content is just the same string

(length diff = length varint byte length) and collapse the embedded content into
one entry (not one parent one child).

### Extend the library to cover both scenarios without and with a schema

Parse https://github.com/substack/osm-pbf-parser/blob/master/lib/osmformat.proto
to find structures and then parse the Prague extract into those structures.
