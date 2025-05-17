<template>
  <div>
    <el-tabs type="border-card">
      <el-tab-pane label="公式计算">
        <ElecClac />
      </el-tab-pane>
      <el-tab-pane label="excel处理">
        <HandleExcel />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import ElecClac from '../elec-clac/index.vue'
import HandleExcel from '../handle-excel/index.vue'
export default {
  components: {
    ElecClac,
    HandleExcel
  }
};
</script>

<style></style>
