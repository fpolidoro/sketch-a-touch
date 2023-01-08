export interface ISize {
  width: number,
  height: number
}

export interface IImageFile extends ISize {
  base64: string,
}

export interface IViewport {
  rows: number,
  cols: number
}