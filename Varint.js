export default class VarInt {
  constructor(/** @type {DataView} */ dataView) {
    if (dataView.byteLength > 9) {
      throw new Error('The var int data view length is too long, var int can be at most 9 bytes. Do not pass in longer data views as it could obscure an error.');
    }

    let byteIndex = 0;
    let bitIndex = 0;
    const varintByteBits = [];
    while (byteIndex < 8) {
      const varintBits = [];
      const byte = dataView.getUint8(byteIndex);
      for (let byteBitIndex = byteIndex === 8 ? 0 : 1; byteBitIndex < 8; byteBitIndex++) {
        const set = (byte & (1 << (7 - byteBitIndex))) !== 0;
        if (byteBitIndex > 0) {
          varintBits.push(set);
        }

        bitIndex++;
      }

      varintByteBits.unshift(...varintBits);

      // Stop looking for more varint bytes if the current, non-last, byte's MSB is zero
      if (byteIndex < 8 && (byte & (1 << 7)) === 0) {
        break;
      }

      byteIndex++;
    }

    this.value = 0;
    for (let index = varintByteBits.indexOf(true) /* First set varint bit */; index < bitIndex; index++) {
      if (varintByteBits[index]) {
        this.value += Math.pow(2, bitIndex - index - 1);
      }
    }

    this.byteLength = byteIndex + 1;
  }
}
