import { Model, Ptr } from 'spinal-core-connectorjs_type';

class SpinalListenerModel extends Model {
   constructor(graph, context, network, deviceId, timeInterval = 5000) {
      super();

      this.add_attr({
         graph: new Ptr(graph),
         listen: true,
         timeInterval: timeInterval,
         deviceId: deviceId,
         context: context,
         network: network
      })
   }
}


spinalCore.register_models([SpinalListenerModel])
export default SpinalListenerModel;
export { SpinalListenerModel }