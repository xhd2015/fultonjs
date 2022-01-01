import axios from "axios"
import qs from "qs"


// use a=1&a=2, rather than a[]=1&a[]=2
export function serializeParamRepeat(params) {
    return qs.stringify(params, { arrayFormat: "repeat" });
}

// config:{useProxy, repeatUseArray, baseURL, url, method, params, headers,data, timeout....}
// proxy: (config)
export async function request(config, proxy) {
    if (config.useProxy) {
        return await proxy(config)
    } else {
        if (!this.repeatUseArray) {
            config.paramsSerializer = serializeParamRepeat;
        }
        return await axios.request(config);
    }
}
