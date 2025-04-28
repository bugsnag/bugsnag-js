const intRange: <T>(min?: number, max?: number) => (value: T) => boolean = (
  min = 1,
  max = Infinity
) => (value) =>
  typeof value === "number" &&
  parseInt("" + value, 10) === value &&
  value >= min && value <= max;

export default intRange