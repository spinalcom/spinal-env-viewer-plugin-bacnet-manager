<template>
   <div class="broadcast_container">
      <div>
         <md-field class="contextInput">
            <label>Network Name</label>
            <md-input v-model="network.name"></md-input>
         </md-field>
      </div>

      <div>
         <md-field class="contextInput">
            <label>broadcast network IP address</label>
            <md-input v-model="network.address"></md-input>
            <span class="md-helper-text">
               To use the default(255.255.255.255) leave this field empty
            </span>
         </md-field>
      </div>

      <div>
         <md-field class="contextInput">
            <label>broadcast network port</label>
            <md-input v-model="network.port"></md-input>
            <span class="md-helper-text">
               To use the default port (47808) leave this field empty
            </span>
         </md-field>
      </div>
   </div>
</template>

<script>
export default {
   name: "broadcastTemplate",
   props: { network: {} },
   data() {
      return {};
   },
   mounted () {
      this.network.address = "255.255.255.255";
      this.network.port = "47808";
   },
};
</script>

<style scoped>
.broadcast_container {
   width: 100%;
   height: 100%;
}

.broadcast_container .contextInput {
   min-height: unset;
}
</style>
