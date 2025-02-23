export default interface Plugins {
  name: string,
  main: any,
  setting: {
    enabled: boolean,
    isLoader: boolean
  }
}