<!--
Copyright 2021 SpinalCom - www.spinalcom.com

This file is part of SpinalCore.

Please read all of the following terms and conditions
of the Free Software license Agreement ("Agreement")
carefully.

This Agreement is a legally binding contract between
the Licensee (as defined below) and SpinalCom that
sets forth the terms and conditions that govern your
use of the Program. By installing and/or using the
Program, you agree to abide by all the terms and
conditions stated or referenced herein.

If you do not agree to abide by these terms and
conditions, do not demonstrate your acceptance and do
not install or use the Program.
You should have received a copy of the license along
with this file. If not, see
<http://resources.spinalcom.com/licenses.pdf>.
-->
<template>
   <div >
       <md-content class="input_container">

       
         <md-field class="contextInput">
            <label>Network Name</label>
            <md-input v-model="network.name"></md-input>
         </md-field>


        <div class="input">
         <md-field class="contextInput">
            <label>Protocol</label>
            <md-input v-model="network.protocol"></md-input>
            <span class="md-helper-text">
               Using http per default
            </span>
         </md-field>
        </div>


        <div class="input">
         <md-field class="contextInput">
            <label>Ip address</label>
            <md-input v-model="network.address"></md-input>
            <span class="md-helper-text">
               Localhost per default
            </span>
         </md-field>
        </div>



        <div class="input">
         <md-field class="contextInput">
            <label>Port</label>
            <md-input v-model="network.port"></md-input>
         </md-field>
        </div>


        <div class="input">
         <md-field class="contextInput">
            <label>Path for APIs</label>
            <md-input v-model="network.path"></md-input>
         </md-field>
        </div>

        <div class="input">
         <md-field class="contextInput" >
            <label>Site</label>
            <md-input v-model="network.site"></md-input>
         </md-field>
        </div>
    </md-content>
    </div>
</template>

<script>
export default {
   name: "ApiTemplate",
   props: { network: {} },
   data() {
      return {};
   },
   mounted(){
      this.network.address = "10.0.0.10";
      this.network.port = 80;
   },

};
</script>

<style scoped>

.input_container {
   width: 100%;
   /* height: 100%; */
   display: flex;
   justify-content: space-between;
   align-items: flex-start;
   flex-wrap: wrap;
}

.input_container .input {
   width: 30%;
}

</style>