import { IsNanPipe } from './is-nan.pipe';

describe('IsNanPipe', () => {
  it('create an instance', () => {
    const pipe = new IsNanPipe();
    expect(pipe).toBeTruthy();
  });
});
