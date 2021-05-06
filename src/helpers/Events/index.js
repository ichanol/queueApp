const callback = {}

const Events = {
  subscribe: (eventName, cb) => {
    if (!callback[eventName]) {
      callback[eventName] = []
    }
    const index = callback[eventName].push(cb) - 1
    return () => delete callback[eventName][index]
  },
  publish: (eventName, data) =>
    callback[eventName] && callback[eventName].forEach((cb) => cb && cb(data)),
  getCallback: () => callback,
}

export { Events }
