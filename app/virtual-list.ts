import range from 'lodash.range';

export default class VirtualList<T> extends Array<T> {
  at(index: number): T {
    const length = this.length;
    index = ((index % length) + length) % length;
    return this[index];
  }

  slice(start: number = 0, end: number = 0): VirtualList<T> {
    return new VirtualList<T>(...range(start, end).map(n => this.at(n)));
  }
}
