const bacnet = require("bacstack");
const ObjectTypes = bacnet.enum.ObjectTypes;

export const NETWORK_TYPE = "GTBNetwork";
export const CONTEXT_TYPE = "Network";

export const MESSAGES = {
  wait: {
    text: "waiting...",
    id: "waiting",
  },
  recover: {
    text: "recovering...",
    id: "recover",
  },
  success: {
    text: "success",
    id: "success",
  },
  error: {
    text: "fail",
    id: "error",
  },
};

export const SENSOR_TYPES = [
  {
    name: "ANALOG INPUT",
    checked: true,
    value: ObjectTypes.OBJECT_ANALOG_INPUT,
    id: ObjectTypes.OBJECT_ANALOG_INPUT,
  },
  {
    name: "ANALOG OUTPUT",
    checked: true,
    value: ObjectTypes.OBJECT_ANALOG_OUTPUT,
    id: ObjectTypes.OBJECT_ANALOG_OUTPUT,
  },
  {
    name: "ANALOG VALUE",
    checked: true,
    value: ObjectTypes.OBJECT_ANALOG_VALUE,
    id: ObjectTypes.OBJECT_ANALOG_VALUE,
  },
  {
    name: "BINARY INPUT",
    checked: true,
    value: ObjectTypes.OBJECT_BINARY_INPUT,
    id: ObjectTypes.OBJECT_BINARY_INPUT,
  },
  {
    name: "BINARY OUTPUT",
    checked: true,
    value: ObjectTypes.OBJECT_BINARY_OUTPUT,
    id: ObjectTypes.OBJECT_BINARY_OUTPUT,
  },
  {
    name: "BINARY VALUE",
    checked: true,
    value: ObjectTypes.OBJECT_BINARY_VALUE,
    id: ObjectTypes.OBJECT_BINARY_VALUE,
  },
  {
    name: "BINARY LIGHTING OUTPUT",
    checked: true,
    value: ObjectTypes.OBJECT_BINARY_LIGHTING_OUTPUT,
    id: ObjectTypes.OBJECT_BINARY_LIGHTING_OUTPUT,
  },
  {
    name: "MULTI STATE INPUT",
    checked: true,
    value: ObjectTypes.OBJECT_MULTI_STATE_INPUT,
    id: ObjectTypes.OBJECT_MULTI_STATE_INPUT,
  },
  {
    name: "MULTI STATE OUTPUT",
    checked: true,
    value: ObjectTypes.OBJECT_MULTI_STATE_OUTPUT,
    id: ObjectTypes.OBJECT_MULTI_STATE_OUTPUT,
  },
  {
    name: "MULTI STATE VALUE",
    checked: true,
    value: ObjectTypes.OBJECT_MULTI_STATE_VALUE,
    id: ObjectTypes.OBJECT_MULTI_STATE_VALUE,
  },
];
