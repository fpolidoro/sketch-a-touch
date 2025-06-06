export interface IArea {
    type: 'circle'|'rectangle',
    x: number,
    y: number,
    /** The tile this area (its center) belongs to */
    pos: ITile
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
    gesture?: 'string',
    start?: number,
    end?: number,
    direction?: 'row'|'col'
}

export interface ITile {
    r: number,
    c: number
}