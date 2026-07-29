export interface size {
  width: number;
  height: number;
}

export interface position {
  x: number;
  y: number;
}

export interface preBuildMark {
  type: string;
  size: size;
  position: position;
  snap: position;
  valid: boolean;
}

export interface data {
  price: number;
  size: size;
}

export interface time {
  hours: number;
  minutes: number;
  seconds: number;
}
