<template>
  <div class="elec-calc-container">
    <!-- 选择区域 -->
    <el-card class="formula-selection-card" shadow="hover">
      <div class="card-title">
        <i class="el-icon-s-opportunity animated-icon"></i>
        <span>公式选择</span>
      </div>

      <el-divider content-position="center">
        <i class="el-icon-star-off"></i>
      </el-divider>

      <div class="selection-area">
        <!-- 一级公式选择 -->
        <el-form :model="formData" label-width="120px" size="medium">
          <el-form-item label="一级公式">
            <el-select
              v-model="formData.level1Formula"
              placeholder="请选择一级公式"
              @change="handleLevel1Change"
              style="width: 100%"
            >
              <el-option
                v-for="item in level1Options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </el-select>
          </el-form-item>

          <!-- 二级公式选择 -->
          <el-form-item label="二级公式" v-if="formData.level1Formula">
            <el-select
              v-model="formData.level2Formula"
              placeholder="请选择二级公式"
              @change="handleLevel2Change"
              style="width: 100%"
            >
              <el-option
                v-for="item in level2Options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 公式展示和输入区域 -->
    <el-card
      class="formula-input-card"
      shadow="hover"
      v-if="formData.level2Formula"
    >
      <div class="card-title">
        <i class="el-icon-edit animated-icon"></i>
        <span>{{ selectedFormulaTitle }}</span>
      </div>

      <el-divider content-position="center">
        <i class="el-icon-star-off"></i>
      </el-divider>

      <div class="formula-display">
        <div class="formula-title">公式：</div>
        <div class="formula-expression">{{ selectedFormula }}</div>
      </div>

      <el-form
        :model="formData"
        label-width="180px"
        class="input-form"
        size="medium"
      >
        <!-- 差动保护校验输入框 -->
        <el-form-item
          :label="inputLabel"
          v-if="
            !showGroundDistanceInputs &&
            !showZeroSequenceInputs &&
            !showPTDisconnectionInputs
          "
        >
          <el-input
            v-model.number="formData.inputValue"
            type="number"
            placeholder="请输入数值"
            @input="validateInput"
          >
            <template slot="append">A</template>
          </el-input>
        </el-form-item>

        <!-- 接地距离保护校验输入框 -->
        <template v-if="showGroundDistanceInputs">
          <el-form-item label="零序补偿系数 K">
            <el-input
              v-model.number="formData.kValue"
              type="number"
              placeholder="请输入零序补偿系数"
              @input="validateGroundInput('kValue')"
            >
            </el-input>
          </el-form-item>

          <el-form-item label="正序灵敏角 φ">
            <el-input
              v-model.number="formData.phiValue"
              type="number"
              placeholder="请输入正序灵敏角"
              @input="validateGroundInput('phiValue')"
            >
              <template slot="append">°</template>
            </el-input>
          </el-form-item>

          <el-form-item label="故障电流大小 I">
            <el-input
              v-model.number="formData.iValue"
              type="number"
              placeholder="请输入故障电流大小"
              @input="validateGroundInput('iValue')"
            >
              <template slot="append">A</template>
            </el-input>
          </el-form-item>

          <el-form-item label="相间距离定值 Zzd">
            <el-input
              v-model.number="formData.zzdValue"
              type="number"
              placeholder="请输入相间距离定值"
              @input="validateGroundInput('zzdValue')"
            >
              <template slot="append">Ω</template>
            </el-input>
          </el-form-item>
        </template>

        <!-- 零序保护校验输入框 -->
        <template v-if="showZeroSequenceInputs">
          <el-form-item label="零序过流定值 I01zd">
            <el-input
              v-model.number="formData.zeroSequenceValue"
              type="number"
              placeholder="请输入零序过流定值"
              @input="validateZeroSequenceInput"
            >
              <template slot="append">A</template>
            </el-input>
          </el-form-item>
        </template>

        <!-- PT断线相过流保护校验输入框 -->
        <template v-if="showPTDisconnectionInputs">
          <el-form-item :label="ptDisconnectionInputLabel">
            <el-input
              v-model.number="formData.ptDisconnectionValue"
              type="number"
              placeholder="请输入定值"
              @input="validatePTDisconnectionInput"
            >
              <template slot="append">A</template>
            </el-input>
          </el-form-item>
        </template>

        <!-- 倍数选择 -->
        <el-form-item label="选定倍数" v-if="showMultiplier">
          <el-radio-group v-model="formData.multiplier">
            <el-radio :label="0.95">0.95</el-radio>
            <el-radio :label="1.05">1.05</el-radio>
            <el-radio :label="1.2" v-if="!showGroundDistanceInputs"
              >1.2</el-radio
            >
            <el-radio :label="0.7" v-if="showGroundDistanceInputs"
              >0.7</el-radio
            >
          </el-radio-group>
        </el-form-item>

        <!-- 按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            @click="calculateResult"
            :disabled="!canCalculate"
            >校验</el-button
          >
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 结果展示区域 -->
    <el-card class="result-card" shadow="hover" v-if="showResult">
      <div class="card-title">
        <i class="el-icon-data-analysis animated-icon"></i>
        <span>校验结果</span>
      </div>

      <el-divider content-position="center">
        <i class="el-icon-star-off"></i>
      </el-divider>

      <div class="result-area">
        <!-- 正常态表格 -->
        <div class="table-title">正常态：</div>
        <el-table
          :data="normalStateData"
          border
          style="width: 100%"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
          }"
        >
          <el-table-column
            prop="ua"
            label="Ua"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="ub"
            label="Ub"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="uc"
            label="Uc"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="ia"
            label="Ia"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="ib"
            label="Ib"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="ic"
            label="Ic"
            align="center"
          ></el-table-column>
        </el-table>

        <!-- 故障态表格 -->
        <div class="table-title" style="margin-top: 20px">故障态：</div>
        <el-table
          :data="faultStateData"
          border
          style="width: 100%"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
          }"
        >
          <el-table-column
            prop="ua"
            label="Ua"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="ub"
            label="Ub"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="uc"
            label="Uc"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="ia"
            label="Ia"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="ib"
            label="Ib"
            align="center"
          ></el-table-column>
          <el-table-column
            prop="ic"
            label="Ic"
            align="center"
          ></el-table-column>
        </el-table>

        <!-- 计算详情 -->
        <div class="calculation-details">
          <div class="details-title">计算详情：</div>
          <div class="details-content">
            <p>{{ calculationDetails }}</p>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: "ElecCalc",
  data() {
    return {
      // 一级公式选项
      level1Options: [
        { value: "1", label: "差动保护校验" },
        { value: "2", label: "接地距离保护校验" },
        { value: "3", label: "零序保护校验" },
        { value: "4", label: "PT断线相过流保护校验" },
      ],
      // 二级公式选项（根据一级公式动态变化）
      level2Options: [],
      // 表单数据
      formData: {
        level1Formula: "",
        level2Formula: "",
        inputValue: "",
        kValue: "",
        phiValue: "",
        iValue: "",
        zzdValue: "",
        zeroSequenceValue: "",
        ptDisconnectionValue: "",
        multiplier: 0.95,
      },
      // 是否显示结果
      showResult: false,
      // 正常态数据
      normalStateData: [
        {
          ua: "57.74∠0°V",
          ub: "57.74∠-120°V",
          uc: "57.74∠120°V",
          ia: "0∠0°A",
          ib: "0∠-120°A",
          ic: "0∠120°A",
        },
      ],
      // 故障态数据
      faultStateData: [
        {
          ua: "0∠0°V",
          ub: "57.74∠-120°V",
          uc: "57.74∠120°V",
          ia: "0∠0°A",
          ib: "0∠-120°A",
          ic: "0∠120°A",
        },
      ],
      // 计算详情
      calculationDetails: "",
    };
  },
  computed: {
    // 是否可以计算
    canCalculate() {
      if (["1", "2", "3"].includes(this.formData.level2Formula)) {
        return this.formData.inputValue !== "";
      } else if (["4", "5", "6"].includes(this.formData.level2Formula)) {
        return (
          this.formData.kValue !== "" &&
          this.formData.phiValue !== "" &&
          this.formData.iValue !== "" &&
          this.formData.zzdValue !== ""
        );
      } else if (["7", "8", "9", "10"].includes(this.formData.level2Formula)) {
        return this.formData.zeroSequenceValue !== "";
      } else if (["11", "12"].includes(this.formData.level2Formula)) {
        return this.formData.ptDisconnectionValue !== "";
      }
      return false;
    },
    // 输入标签
    inputLabel() {
      if (this.formData.level2Formula === "1") {
        return "差动I段定值 Icdqd1";
      } else if (this.formData.level2Formula === "2") {
        return "差动II段定值 Icdqd2";
      } else if (this.formData.level2Formula === "3") {
        return "零序差动定值 Icdqd0";
      }
      return "输入值";
    },
    // PT断线相过流保护校验输入标签
    ptDisconnectionInputLabel() {
      if (this.formData.level2Formula === "11") {
        return "PT断线相过流定值 Iptdx";
      } else if (this.formData.level2Formula === "12") {
        return "PT断线零序过流定值 I0ptdx";
      }
      return "输入值";
    },
    // 当前选择的公式标题
    selectedFormulaTitle() {
      if (!this.formData.level2Formula) return "";

      const formulaTitles = {
        1: "差动I段校验",
        2: "差动II段校验",
        3: "零序差动校验",
        4: "接地I段校验",
        5: "接地II段校验",
        6: "接地III段校验",
        7: "零序I段校验",
        8: "零序II段校验",
        9: "零序III段校验",
        10: "零序IV段校验",
        11: "PT断线相过流校验",
        12: "PT断线零序过流校验",
      };

      return formulaTitles[this.formData.level2Formula] || "";
    },
    // 当前选择的公式表达式
    selectedFormula() {
      if (!this.formData.level2Formula) return "";

      const formulas = {
        1: "I1＝0.5*1.5*Icdqd1",
        2: "I2＝0.5*Icdqd2",
        3: "I＝0.78*0.5*Icdqd0    I0＝1.1＊0.5*Icdqd0",
        4: "U1=(1+K)*I*Zzd1",
        5: "U2＝(1+K)*I*Zzd2",
        6: "U3=(1+K)*I*Zzd3",
        7: "I＝I01zd",
        8: "I＝I01zd",
        9: "I＝I01zd",
        10: "I＝I01zd",
        11: "Ipt＝Iptdx",
        12: "I0pt＝I0ptdx",
      };

      return formulas[this.formData.level2Formula] || "";
    },
    // 是否显示倍数选择
    showMultiplier() {
      return [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
      ].includes(this.formData.level2Formula);
    },
    // 是否显示接地距离保护校验的输入框
    showGroundDistanceInputs() {
      return ["4", "5", "6"].includes(this.formData.level2Formula);
    },
    // 是否显示零序保护校验的输入框
    showZeroSequenceInputs() {
      return ["7", "8", "9", "10"].includes(this.formData.level2Formula);
    },
    // 是否显示PT断线相过流保护校验的输入框
    showPTDisconnectionInputs() {
      return ["11", "12"].includes(this.formData.level2Formula);
    },
  },
  methods: {
    // 处理一级公式变化
    handleLevel1Change() {
      this.formData.level2Formula = "";
      this.showResult = false;

      // 根据一级公式设置二级公式选项
      if (this.formData.level1Formula === "1") {
        this.level2Options = [
          { value: "1", label: "差动I段校验" },
          { value: "2", label: "差动II段校验" },
          { value: "3", label: "零序差动校验" },
        ];
      } else if (this.formData.level1Formula === "2") {
        this.level2Options = [
          { value: "4", label: "接地I段校验" },
          { value: "5", label: "接地II段校验" },
          { value: "6", label: "接地III段校验" },
        ];
      } else if (this.formData.level1Formula === "3") {
        this.level2Options = [
          { value: "7", label: "零序I段校验" },
          { value: "8", label: "零序II段校验" },
          { value: "9", label: "零序III段校验" },
          { value: "10", label: "零序IV段校验" },
        ];
      } else if (this.formData.level1Formula === "4") {
        this.level2Options = [
          { value: "11", label: "PT断线相过流校验" },
          { value: "12", label: "PT断线零序过流校验" },
        ];
      } else {
        this.level2Options = [];
      }
    },

    // 处理二级公式变化
    handleLevel2Change() {
      this.showResult = false;
      this.resetForm();
      this.resetTableData();
    },

    // 添加重置表格数据的方法
    resetTableData() {
      // 重置正常态数据
      this.normalStateData = [
        {
          ua: "57.74∠0°V",
          ub: "57.74∠-120°V",
          uc: "57.74∠120°V",
          ia: "0∠0°A",
          ib: "0∠-120°A",
          ic: "0∠120°A",
        },
      ];

      // 重置故障态数据
      this.faultStateData = [
        {
          ua: "0∠0°V",
          ub: "57.74∠-120°V",
          uc: "57.74∠120°V",
          ia: "0∠0°A",
          ib: "0∠-120°A",
          ic: "0∠120°A",
        },
      ];
    },

    // 验证输入
    validateInput() {
      if (isNaN(this.formData.inputValue) || this.formData.inputValue < 0) {
        this.formData.inputValue = "";
      }
    },

    // 验证接地距离保护校验输入
    validateGroundInput(field) {
      if (isNaN(this.formData[field]) || this.formData[field] < 0) {
        this.formData[field] = "";
      }
    },

    // 验证零序保护校验输入
    validateZeroSequenceInput() {
      if (
        isNaN(this.formData.zeroSequenceValue) ||
        this.formData.zeroSequenceValue < 0
      ) {
        this.formData.zeroSequenceValue = "";
      }
    },

    // 验证PT断线相过流保护校验输入
    validatePTDisconnectionInput() {
      if (
        isNaN(this.formData.ptDisconnectionValue) ||
        this.formData.ptDisconnectionValue < 0
      ) {
        this.formData.ptDisconnectionValue = "";
      }
    },

    // 计算结果
    calculateResult() {
      // 差动保护校验计算
      if (["1", "2", "3"].includes(this.formData.level2Formula)) {
        if (!this.formData.inputValue) {
          this.$message.error("请输入数值");
          return;
        }

        switch (this.formData.level2Formula) {
          case "1": // 差动I段校验
            {
              const result = 0.5 * 1.5 * this.formData.inputValue;
              const finalResult = result * this.formData.multiplier; // 应用倍数
              this.calculationDetails = `I1 = 0.5 * 1.5 * ${
                this.formData.inputValue
              } * ${this.formData.multiplier} = ${finalResult.toFixed(2)} A`;

              // 更新故障态表格中的Ia值
              this.faultStateData[0].ia = `${finalResult.toFixed(2)}∠0°A`;
            }
            break;
          case "2": // 差动II段校验
            {
              const result = 0.5 * this.formData.inputValue;
              const finalResult = result * this.formData.multiplier; // 应用倍数
              this.calculationDetails = `I2 = 0.5 * ${
                this.formData.inputValue
              } * ${this.formData.multiplier} = ${finalResult.toFixed(2)} A`;

              // 更新故障态表格中的Ia值
              this.faultStateData[0].ia = `${finalResult.toFixed(2)}∠0°A`;
            }
            break;
          case "3": // 零序差动校验
            {
              const i = 0.78 * 0.5 * this.formData.inputValue;
              const i0 = 1.1 * 0.5 * this.formData.inputValue;

              // 更新正常态表格中的Ia值为I
              this.normalStateData[0].ia = `${i.toFixed(2)}∠90°A`;
              this.normalStateData[0].ib = `0∠-30°A`;
              this.normalStateData[0].ic = `0∠210°A`;

              // 更新故障态表格中的Ia值为I0
              this.faultStateData[0].ia = `${i0.toFixed(2)}∠0°A`;

              this.calculationDetails = `I = 0.78 * 0.5 * ${
                this.formData.inputValue
              } = ${i.toFixed(2)} A, I0 = 1.1 * 0.5 * ${
                this.formData.inputValue
              } = ${i0.toFixed(2)} A`;
            }
            break;
        }
      }
      // 接地距离保护校验计算
      else if (["4", "5", "6"].includes(this.formData.level2Formula)) {
        if (!this.canCalculate) {
          this.$message.error("请填写所有输入项");
          return;
        }

        const k = this.formData.kValue;
        const i = this.formData.iValue;
        const zzd = this.formData.zzdValue;
        const phi = this.formData.phiValue;
        const multiplier = this.formData.multiplier;

        // 计算电压值
        const voltage = (1 + k) * i * zzd * multiplier;

        // 更新故障态表格中的Ua值和Ia值
        this.faultStateData[0].ua = `${voltage.toFixed(2)}∠0°V`;
        this.faultStateData[0].ia = `${(i * multiplier).toFixed(2)}∠${-phi}°A`;

        // 设置计算详情
        const formulaPrefix = "U";

        this.calculationDetails = `${formulaPrefix} = (1 + ${k}) * ${i} * ${zzd} * ${multiplier} = ${voltage.toFixed(
          2
        )} V, Ia = ${i} * ${multiplier} = ${(i * multiplier).toFixed(2)} A`;
      }
      // 零序保护校验计算
      else if (["7", "8", "9", "10"].includes(this.formData.level2Formula)) {
        if (!this.formData.zeroSequenceValue) {
          this.$message.error("请输入零序过流定值");
          return;
        }

        const i01zd = this.formData.zeroSequenceValue;
        const multiplier = this.formData.multiplier;

        // 计算电流值
        const current = i01zd * multiplier;

        // 更新故障态表格中的Ia值
        this.faultStateData[0].ia = `${current.toFixed(2)}∠-78°A`;

        // 设置计算详情
        this.calculationDetails = `I = ${i01zd} * ${multiplier} = ${current.toFixed(
          2
        )} A`;
      }
      // PT断线相过流保护校验计算
      else if (["11", "12"].includes(this.formData.level2Formula)) {
        if (!this.formData.ptDisconnectionValue) {
          this.$message.error("请输入定值");
          return;
        }

        const ptValue = this.formData.ptDisconnectionValue;
        const multiplier = this.formData.multiplier;

        // 计算电流值
        const current = ptValue * multiplier;

        // 首先重置故障态表格中的所有电流值
        this.faultStateData[0].ia = "0∠0°A";
        this.faultStateData[0].ib = "0∠-120°A";
        this.faultStateData[0].ic = "0∠120°A";

        if (this.formData.level2Formula === "11") {
          // PT断线相过流校验 - 更新故障态表格中的Ia、Ib、Ic值
          this.faultStateData[0].ia = `${current.toFixed(2)}∠0°A`;
          this.faultStateData[0].ib = `${current.toFixed(2)}∠-120°A`;
          this.faultStateData[0].ic = `${current.toFixed(2)}∠120°A`;

          // 设置计算详情
          this.calculationDetails = `Ipt = ${ptValue} * ${multiplier} = ${current.toFixed(
            2
          )} A`;
        } else {
          // PT断线零序过流校验 - 只更新故障态表格中的Ia值
          this.faultStateData[0].ia = `${current.toFixed(2)}∠0°A`;
          this.faultStateData[0].ib = `0∠-120°A`;
          this.faultStateData[0].ic = `0∠120°A`;
          // Ib和Ic保持默认值 (已在上面重置)

          // 设置计算详情
          this.calculationDetails = `I0pt = ${ptValue} * ${multiplier} = ${current.toFixed(
            2
          )} A`;
        }
      }

      // 显示结果
      this.showResult = true;

      // 显示成功消息
      this.$message({
        message: "计算完成！",
        type: "success",
        duration: 2000,
      });
    },

    // 重置表单
    resetForm() {
      this.formData.inputValue = "";
      this.formData.kValue = "";
      this.formData.phiValue = "";
      this.formData.iValue = "";
      this.formData.zzdValue = "";
      this.formData.zeroSequenceValue = "";
      this.formData.ptDisconnectionValue = "";
      this.formData.multiplier = 0.95;
      this.showResult = false;
    },
  },
};
</script>

<style scoped>
.elec-calc-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 10px 30px 10px; /* 增加底部内边距 */
  height: 100%;
  overflow-y: auto;
}

.formula-selection-card,
.formula-input-card,
.result-card {
  border-radius: 8px;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: visible; /* 确保内容不会被裁剪 */
}

.formula-selection-card:hover,
.formula-input-card:hover,
.result-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  z-index: 1; /* 添加z-index确保悬停卡片在上层 */
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #409eff;
  display: flex;
  align-items: center;
}

.selection-area,
.formula-display,
.result-area {
  padding: 10px 0;
}

.formula-title {
  font-weight: bold;
  margin-bottom: 10px;
}

.formula-expression {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 16px;
  color: #606266;
  margin-bottom: 20px;
}

.input-form {
  margin-top: 20px;
}

.table-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #606266;
}

.calculation-details {
  margin-top: 20px;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #67c23a;
}

.details-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #67c23a;
}

.details-content p {
  margin: 8px 0;
  line-height: 1.5;
}

.animated-icon {
  transition: all 0.3s;
  margin-right: 5px;
}

.animated-icon:hover {
  transform: scale(1.2);
  color: #409eff;
}

/* 滚动条美化 */
.elec-calc-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.elec-calc-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.elec-calc-container::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}
</style>
