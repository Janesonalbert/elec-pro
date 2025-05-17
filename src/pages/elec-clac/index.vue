<template>
  <div>
    <el-select v-model="value" placeholder="请选择一级公式">
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      >
      </el-option>
    </el-select>
  </div>
</template>

<script>
export default {
  name: "ElecClac",
  data() {
    return {
      options: [
        {
          value: "1",
          label: "差动保护校验",
        },
        {
          value: "2",
          label: "接地距离保护校验",
        },
        {
          value: "3",
          label: "相间距离保护校验",
        },
        {
          value: "4",
          label: "零序保护校验",
        },
        {
          value: "5",
          label: "听线相过流保护校验",
        },
      ],
      value: "",
    };
  },
};
</script>
