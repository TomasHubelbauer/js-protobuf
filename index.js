import VarInt from './VarInt.js';

window.addEventListener('load', async () => {
  const zoom = 18;

  async function render(longitude, latitude) {
    const x = Math.floor((longitude + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

    const url = `https://www.qwant.com/maps/tiles/ozpoi/${zoom}/${x}/${y}.pbf`;
    console.log(url);

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    for (let index = 0; index < dataView.byteLength; index++) {
      const byte = dataView.getUint8(index);
      const bit0 = (byte & (1 << (7 - 0))) !== 0;
      const bit1 = (byte & (1 << (7 - 1))) !== 0;
      const bit2 = (byte & (1 << (7 - 2))) !== 0;
      const bit3 = (byte & (1 << (7 - 3))) !== 0;
      const bit4 = (byte & (1 << (7 - 4))) !== 0;
      const bit5 = (byte & (1 << (7 - 5))) !== 0;
      const bit6 = (byte & (1 << (7 - 6))) !== 0;
      const bit7 = (byte & (1 << (7 - 7))) !== 0;
      const wireType = bit5 * 4 + bit6 * 2 + bit7;
      const fieldNumber = bit0 * 16 + bit1 * 8 + bit2 * 4 + bit3 * 2 + bit4;
      console.log(index, byte.toString(16), byte.toString(2));

      const types = [];
      switch (wireType) {
        // Varint
        case 0: {
          console.log('\t', fieldNumber, 'varint');

          const varint = new VarInt(new DataView(arrayBuffer, index + 1, 9));
          index += varint.byteLength;

          types.push({ type: 'varint', valueRaw: varint.value, valueZigZag: 'todo' });

          console.log('\t', types[types.length - 1]);
          break;
        }

        // 64-bit
        case 1: {
          console.log('\t', fieldNumber, '64-bit');
          break;
        }

        // Length-delimited
        case 2: {
          console.log('\t', fieldNumber, 'length-delimited');

          const lengthVarint = new VarInt(new DataView(arrayBuffer, index + 1, 9));
          index += lengthVarint.byteLength;

          // TODO: Find out why this string has no payload and instead there is more ProtoBuf
          if (lengthVarint.value === 320) {
            types.push({ type: 'string', length: lengthVarint.value });
          } else {
            const text = String.fromCharCode(...new Uint8Array(arrayBuffer, index + 1, lengthVarint.value));
            index += lengthVarint.value;

            types.push({ type: 'string', length: lengthVarint.value, text });
          }

          console.log('\t', types[types.length - 1]);
          break;
        }

        // Start group
        case 3: {
          console.log('\t', fieldNumber, 'start group');
          break;
        }

        // End group
        case 4: {
          console.log('\t', fieldNumber, 'end group');
          break;
        }

        // 32-bit
        case 5: {
          console.log('\t', fieldNumber, '32-bit');
          break;
        }

        default: {
          throw new Error(`Unknown wire type ${wireType}.`);
        }
      }
    }

    console.log(types);
  }

  if (localStorage.longitude && localStorage.latitude) {
    await render(Number(localStorage.longitude), Number(localStorage.latitude));
  }

  // Allow the user to watch their location so new tiles are fetched or force it
  // if there are no remembered coordinates in the local storage
  const watch = false || (localStorage.longitude && localStorage.latitude);
  if (watch) {
    navigator.geolocation.watchPosition(
      position => {
        localStorage.longitude = position.coords.longitude;
        localStorage.latitude = position.coords.latitude;
        render(position.coords.longitude, position.coords.latitude);
      },
      error => console.log(error),
      { enableHighAccuracy: true }
    );
  }
});
