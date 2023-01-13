import { ErrorTextPipe } from './error-text.pipe';

describe('ErrorTextPipe', () => {
  it('create an instance', () => {
    const pipe = new ErrorTextPipe();
    expect(pipe).toBeTruthy();
  });
});
