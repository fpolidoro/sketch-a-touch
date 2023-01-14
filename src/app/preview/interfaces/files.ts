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

export interface IItem {
  icon?: string,
  label: string,
  value: string
}

export interface INestedItem {
  icon?: string,
  label: string,
  value?: string,
  items?: IItem[]
}