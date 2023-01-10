export interface IArea {
    type: 'circle'|'rect',
    x: number,
    y: number,
}

export interface IRect extends IArea {
    w: number,
    h: number
}

export interface ICircle extends IArea {
    r: number
}

export interface IInteractiveArea {
    area: IArea,
    gesture: 'string',
    start: number,
    end: number,
    direction: 'row'|'col'
}