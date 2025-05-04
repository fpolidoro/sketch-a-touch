import { ErrorDetectorPipe } from './error-detector.pipe';

describe('ErrorDetectorPipe', () => {
  it('create an instance', () => {
    const pipe = new ErrorDetectorPipe();
    expect(pipe).toBeTruthy();
  });
});
