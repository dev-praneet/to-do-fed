export type METHOD = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const nextAppURL = process.env.NEXT_PUBLIC_APP_URL;

const BASE_API_URL = "/api";

const HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

export type QueryParamType = { [key: string]: string };

export type CallApiArguments = {
  endPoint: string;
  method?: METHOD;
  headers?: {};
  body?: any;
  queryParams?: QueryParamType | null;
};

const callAPI = (arg: CallApiArguments) => {
  const {
    endPoint,
    method = "GET",
    headers = {},
    body = null,
    queryParams = null,
  } = arg;
  const token = null;

  const newUrl = queryParams
    ? `${BASE_API_URL}${endPoint}?${new URLSearchParams(queryParams)}`
    : `${BASE_API_URL}${endPoint}`;

  const options: any = {
    method,
    headers: {
      ...HEADERS,
    },
  };

  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  if (headers) {
    options.headers = {
      ...options.headers,
      ...headers,
    };
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  return fetch(newUrl, options).then(
    (response) => response.json(),
    (err) => console.error("err", err)
  );
};

export default callAPI;
