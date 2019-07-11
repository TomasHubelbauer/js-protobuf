window.addEventListener('load', () => {
  const downloadButton = document.getElementById('downloadButton');
  downloadButton.addEventListener('click', async () => {
    const response = await fetch('Prag.osm.pbf');

    const total = Number(response.headers.get('content-length'));
    const buffer = new Uint8Array(total);

    const downloadProgress = document.createElement('progress');
    downloadProgress.max = total;
    document.body.append(document.createTextNode('Downloading…'));
    document.body.append(downloadProgress);
    downloadButton.remove();

    let loaded = 0;

    const reader = response.body.getReader();
    let result;
    while (!(result = await reader.read()).done) {
      buffer.set(result.value, loaded);
      loaded += result.value.length;
      downloadProgress.value = loaded;
    }

    document.body.append(document.createTextNode('Parsing…'));
    downloadProgress.remove();

    const dataView = new DataView(buffer.buffer);

    // Give the UI a chance to render before the heavy-lifting parsing routine
    await new Promise(resolve => window.setTimeout(resolve, 100));

    const timestamp = performance.now();
    const types = [...parse(dataView)];
    document.body.append(document.createTextNode(`Parsed in ${((performance.now() - timestamp) / 1000).toFixed(2)} s.`));

    render(types, document.body);
  });
});

const previewLength = 25;

function render(/** @type {[]} */ types, /** @type {HTMLElement} */ target) {
  for (let type of types) {
    const typeDiv = document.createElement('div');
    switch (type.wireType) {
      case 'varint': {
        typeDiv.textContent = `Varint (field number ${type.fieldNumber}) @${type.index}: ${type.valueRaw}`;
        break;
      }

      case '64-bit': {
        throw new Error('64-bit is not implemented yet');
      }

      case 'length-delimited': {
        typeDiv.textContent = `Length delimited (field number ${type.fieldNumber}) @${type.index} (length ${type.length}): `;
        if (type.text) {
          const previewCode = document.createElement('code');
          previewCode.textContent = type.text.length <= previewLength ? type.text : type.text.substring(0, previewLength);
          typeDiv.append(previewCode);
          if (type.text.length > previewLength) {
            typeDiv.append(document.createTextNode(`… (+${type.text.length - previewLength})`));
          }
        }

        if (type.embedded) {
          render(type.embedded, typeDiv);
        }

        break;
      }

      case 'start-group': {
        throw new Error('Start group is not implemented yet');
      }

      case 'end-group': {
        throw new Error('End group is not implemented yet');
      }

      case '32-bit': {
        throw new Error('32-bit is not implemented yet');
      }

      default: {
        throw new Error('Unexpected wire type!');
      }
    }

    target.append(typeDiv);
  }
}

function* parse(/** @type {DataView} */ dataView) {
  let index = 0;
  while (index < dataView.byteLength) {
    const byte = dataView.getUint8(index);
    //console.log(`${index}/${dataView.byteLength} (${dataView.byteOffset + index}/${dataView.buffer.byteLength}): DEC ${byte} HEX ${byte.toString(16)} BIN ${byte.toString(2)}`);
    index++;

    const fieldNumber = ((byte & 128) / 8) + ((byte & 64) / 8) + ((byte & 32) / 8) + ((byte & 16) / 8) + ((byte & 8) / 8);
    const wireType = (byte & 4) + (byte & 2) + (byte & 1);
    switch (wireType) {
      // Varint
      case 0: {
        const varint = dataView.getVarint(index);
        yield { wireType: 'varint', fieldNumber, index, valueRaw: varint.value, valueZigZag: 'todo' };
        index += varint.byteLength;
        break;
      }

      // 64-bit
      case 1: {
        yield { wireType: '64-bit', fieldNumber, index };
        throw new Error('64-bit is not implemented yet');
      }

      // Length-delimited
      case 2: {
        const lengthVarint = dataView.getVarint(index);
        if (lengthVarint.value > dataView.byteLength - index) {
          // This most commonly happens when a payload of a length-delimited field is tested to see if valid Protobuf
          // but the test returns a false positive (valid bytes but invalid semantically - like this overflow)
          throw new Error('Appears to be a mis-identified embedded message.');
        }

        const arrayBuffer = dataView.buffer;
        const byteOffset = dataView.byteOffset + index + lengthVarint.byteLength;
        const byteLength = lengthVarint.value;

        const payload = new Uint8Array(arrayBuffer, byteOffset, byteLength);
        let text;

        try {
          // https://stackoverflow.com/a/17192845/2715716
          text = decodeURIComponent(escape(String.fromCharCode(...payload)));
        } catch (error) {
          try {
            text = String.fromCharCode(...payload);
          } catch (error) {
            // Maximum callstack size exceeded? Too long payload for `String.fromCharCode`?
          }
        }

        // Test if this is an embedded message
        try {
          const dataView = new DataView(arrayBuffer, byteOffset, byteLength);
          const embedded = [...parse(dataView)];
          yield { wireType: 'length-delimited', fieldNumber, index, length: lengthVarint.value, payload, text, embedded };
        } catch (error) {
          // No valid Protobuf was found in the length-delimited payload so this is probably not an embedded message
          yield { wireType: 'length-delimited', fieldNumber, index, length: lengthVarint.value, payload, text };
        }

        index += lengthVarint.byteLength + lengthVarint.value;
        break;
      }

      // Start group
      case 3: {
        yield { wireType: 'start-group', fieldNumber, index };
        throw new Error('Start group is not implemented yet');
      }

      // End group
      case 4: {
        yield { wireType: 'end-group', fieldNumber, index };
        throw new Error('End group is not implemented yet');
      }

      // 32-bit
      case 5: {
        yield { wireType: '32-bit', fieldNumber, index };
        throw new Error('32-bit is not implemented yet');
      }

      default: {
        throw new Error(`Unknown wire type ${wireType} at index ${index} (${dataView.byteOffset + index}).`);
      }
    }
  }
}

// TODO: Figure out if Protobuf varints have a maximum amount of bytes with last byte being all 8 bits like SQLite
// https://developers.google.com/protocol-buffers/docs/encoding#varints
DataView.prototype.getVarint = function getVarint(/** @type {Number} */ byteOffset = 0) {
  // TODO: Figure out if TypeScript will respect `@this` somehow instead of `@type {DataView}`
  /** @type {DataView} */
  const dataView = this;

  let byte;
  let value = 0;
  let index = 0;

  do {
    // Multiply each number by this factor so that bit index as well as byte index give the final value
    const factor = Math.pow(2, index * 7);

    byte = dataView.getUint8(byteOffset + index);
    value += (byte & 64) * factor + (byte & 32) * factor + (byte & 16) * factor + (byte & 8) * factor + (byte & 4) * factor + (byte & 2) * factor + (byte & 1) * factor;
    index++;
  } while (byte & 128 /* Continue looking if the initial bit is non-zero, can only be 0 or 128. */);

  return { value, byteLength: index };
}
