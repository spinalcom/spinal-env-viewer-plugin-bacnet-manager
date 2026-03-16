export const STATES = Object.freeze({
  initial: "initial",
  readyToDiscover: "readyToDiscover",
  discovering: "discovering",
  discovered: "discovered",
  readyToCreate: "readyToCreate",
  creating: "creating",
  created: "created",
  error: "error",
  timeout: "timeout",
  cancelled: "cancelled",
  pending: "pending",
  stopped: "stopped"
});



export const DISCOVER_MESSAGES = Object.freeze({
  [STATES.initial]: "Discover network to find devices",
  [STATES.readyToDiscover]: "Discover network to find devices",
  [STATES.discovering]: "Discovering devices on the network...",
  [STATES.discovered]: "Devices discovered successfully.",
  [STATES.readyToCreate]: "Ready to create devices in SpinalHub.",
  [STATES.creating]: "Creating devices in SpinalHub...",
  [STATES.created]: "Devices created successfully in SpinalHub.",
  [STATES.error]: "An error occurred during the discovery process.",
  [STATES.timeout]: "Discovery timed out. Please try again.",
  [STATES.cancelled]: "Discovery cancelled.",
  [STATES.pending]: "Discovery pending...",
  [STATES.stopped]: "Discovery stopped."
});