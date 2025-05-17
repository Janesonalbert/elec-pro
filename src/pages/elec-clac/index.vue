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
    <el-card class="formula-input-card" shadow="hover" v-if="formData.level2Formula">
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
      
      <el-form :model="formData" label-width="180px" class="input-form" size="medium">
        <!-- 差动保护校验输入框 -->
        <el-form-item :label="inputLabel" v-if="!showGroundDistanceInputs">
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
        
        <!-- 倍数选择 -->
        <el-form-item label="选定倍数" v-if="showMultiplier">
          <el-radio-group v-model="formData.multiplier">
            <el-radio :label="0.95" v-if="!showGroundDistanceInputs">0.95</el-radio>
            <el-radio :label="1.05" v-if="!showGroundDistanceInputs">1.05</el-radio>
            <el-radio :label="1.2" v-if="!showGroundDistanceInputs">1.2</el-radio>
            
            <el-radio :label="0.95" v-if="showGroundDistanceInputs">0.95</el-radio>
            <el-radio :label="1.05" v-if="showGroundDistanceInputs">1.05</el-radio>
            <el-radio :label="0.7" v-if="showGroundDistanceInputs">0.7</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <!-- 按钮区域 -->
        <el-form-item>
          <el-button 
            type="primary" 
            class="process-button" 
            @click="calculateResult"
            :disabled="!canCalculate"
          >
            <i class="el-icon-check"></i> 校验计算
          </el-button>
          <el-button 
            type="info" 
            plain 
            class="reset-button" 
            @click="resetForm"
          >
            <i class="el-icon-refresh"></i> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 结果展示区域 -->
    <el-card class="result-card" shadow="hover" v-if="showResult">
      <div class="card-title">
        <i class="el-icon-data-analysis animated-icon"></i>
        <span>计算结果</span>
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
          <el-table-column prop="ua" label="Ua" align="center"></el-table-column>
          <el-table-column prop="ub" label="Ub" align="center"></el-table-column>
          <el-table-column prop="uc" label="Uc" align="center"></el-table-column>
          <el-table-column prop="ia" label="Ia" align="center"></el-table-column>
          <el-table-column prop="ib" label="Ib" align="center"></el-table-column>
          <el-table-column prop="ic" label="Ic" align="center"></el-table-column>
        </el-table>
        
        <!-- 故障态表格 -->
        <div class="table-title" style="margin-top: 20px;">故障态：</div>
        <el-table
          :data="faultStateData"
          border
          style="width: 100%"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
          }"
        >
          <el-table-column prop="ua" label="Ua" align="center"></el-table-column>
          <el-table-column prop="ub" label="Ub" align="center"></el-table-column>
          <el-table-column prop="uc" label="Uc" align="center"></el-table-column>
          <el-table-column prop="ia" label="Ia" align="center"></el-table-column>
          <el-table-column prop="ib" label="Ib" align="center"></el-table-column>
          <el-table-column prop="ic" label="Ic" align="center"></el-table-column>
        </el-table>
        
        <!-- 计算详情 -->
        <div class="calculation-details" v-if="calculationDetails">
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
  name: "ElecClac",
  data() {
    return {
      // 一级公式选项
      level1Options: [
        { value: "1", label: "差动保护校验" },
        { value: "2", label: "接地距离保护校验" }
      ],
      // 二级公式选项（根据一级公式动态变化）
      level2Options: [],
      // 表单数据
      formData: {
        level1Formula: "",
        level2Formula: "",
        inputValue: "",
        multiplier: 0.95,
        // 接地距离保护校验所需字段
        kValue: "",
        phiValue: "",
        iValue: "",
        zzdValue: ""
      },
      // 是否显示结果
      showResult: false,
      // 计算详情
      calculationDetails: "",
      // 正常态数据
      normalStateData: [
        {
          ua: "57.74∠0°V",
          ub: "57.74∠-120°V",
          uc: "57.74∠120°V",
          ia: "0∠0°A",
          ib: "0∠-120°A",
          ic: "0∠120°A"
        }
      ],
      // 故障态数据
      faultStateData: [
        {
          ua: "57.74∠0°V",
          ub: "57.74∠-120°V",
          uc: "57.74∠120°V",
          ia: "0∠0°A",
          ib: "0∠-120°A",
          ic: "0∠120°A"
        }
      ]
    };
  },
  computed: {
    // 输入标签
    inputLabel() {
      if (this.formData.level2Formula === "1") {
        return "差动动作电流 Icdqd1";
      } else if (this.formData.level2Formula === "2") {
        return "差动动作电流 Icdqd2";
      } else if (this.formData.level2Formula === "3") {
        return "差动动作电流 Icdqd0";
      }
      return "输入值";
    },
    // 是否可以计算
    canCalculate() {
      if (this.showGroundDistanceInputs) {
        return this.formData.kValue !== "" && 
               this.formData.phiValue !== "" && 
               this.formData.iValue !== "" && 
               this.formData.zzdValue !== "";
      }
      return this.formData.inputValue !== "";
    },
    // 是否显示倍数选择
    showMultiplier() {
      return ["1", "2", "4", "5", "6"].includes(this.formData.level2Formula);
    },
    // 当前选择的公式标题
    selectedFormulaTitle() {
      if (!this.formData.level2Formula) return "";
      
      const formulaTitles = {
        "1": "差动I段校验",
        "2": "差动II段校验",
        "3": "零序差动校验",
        "4": "接地I段校验",
        "5": "接地II段校验",
        "6": "接地III段校验"
      };
      
      return formulaTitles[this.formData.level2Formula] || "";
    },
    // 当前选择的公式表达式
    selectedFormula() {
      if (!this.formData.level2Formula) return "";
      
      const formulas = {
        "1": "I1＝0.5*1.5*Icdqd1",
        "2": "I2＝0.5*Icdqd2",
        "3": "I＝0.78*0.5*Icdqd0    I0＝1.1＊0.5*Icdqd0",
        "4": "U1=(1+K)*I*Zzd1",
        "5": "U2＝(1+K)*I*Zzd2",
        "6": "U3=(1+K)*I*Zzd3"
      };
      
      return formulas[this.formData.level2Formula] || "";
    },
    // 是否显示接地距离保护校验的输入框
    showGroundDistanceInputs() {
      return ["4", "5", "6"].includes(this.formData.level2Formula);
    }
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
          { value: "3", label: "零序差动校验" }
        ];
      } else if (this.formData.level1Formula === "2") {
        this.level2Options = [
          { value: "4", label: "接地I段校验" },
          { value: "5", label: "接地II段校验" },
          { value: "6", label: "接地III段校验" }
        ];
      } else {
        this.level2Options = [];
      }
    },
    
    // 处理二级公式变化
    handleLevel2Change() {
      this.showResult = false;
      this.resetForm();
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
    
    // 计算结果
    calculateResult() {
      // 重置表格数据
      this.normalStateData = [
        {
          ua: "57.74∠0°V",
          ub: "57.74∠-120°V",
          uc: "57.74∠120°V",
          ia: "0∠0°A",
          ib: "0∠-120°A",
          ic: "0∠120°A"
        }
      ];
      
      this.faultStateData = [
        {
          ua: "57.74∠0°V",
          ub: "57.74∠-120°V",
          uc: "57.74∠120°V",
          ia: "0∠0°A",
          ib: "0∠-120°A",
          ic: "0∠120°A"
        }
      ];
      
      // 差动保护校验计算
      if (["1", "2", "3"].includes(this.formData.level2Formula)) {
        if (this.formData.inputValue === "") {
          this.$message.error("请输入差动动作电流值");
          return;
        }
        
        switch (this.formData.level2Formula) {
          case "1": // 差动I段校验
            {
              const result = 0.5 * 1.5 * this.formData.inputValue;
              const finalResult = result * this.formData.multiplier; // 应用倍数
              this.calculationDetails = `I1 = 0.5 * 1.5 * ${this.formData.inputValue} * ${this.formData.multiplier} = ${finalResult.toFixed(2)} A`;
              
              // 更新故障态表格中的Ia值
              this.faultStateData[0].ia = `${finalResult.toFixed(2)}∠0°A`;
            }
            break;
          case "2": // 差动II段校验
            {
              const result = 0.5 * this.formData.inputValue;
              const finalResult = result * this.formData.multiplier; // 应用倍数
              this.calculationDetails = `I2 = 0.5 * ${this.formData.inputValue} * ${this.formData.multiplier} = ${finalResult.toFixed(2)} A`;
              
              // 更新故障态表格中的Ia值
              this.faultStateData[0].ia = `${finalResult.toFixed(2)}∠0°A`;
            }
            break;
          case "3": // 零序差动校验
            {
              const i = 0.78 * 0.5 * this.formData.inputValue;
              const i0 = 1.1 * 0.5 * this.formData.inputValue;
              
              // 更新正常态表格中的Ia值为I
              this.normalStateData[0].ia = `${i.toFixed(2)}∠0°A`;
              
              // 更新故障态表格中的Ia值为I0
              this.faultStateData[0].ia = `${i0.toFixed(2)}∠0°A`;
              
              this.calculationDetails = `I = 0.78 * 0.5 * ${this.formData.inputValue} = ${i.toFixed(2)} A, I0 = 1.1 * 0.5 * ${this.formData.inputValue} = ${i0.toFixed(2)} A`;
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
        let formulaPrefix = "";
        switch (this.formData.level2Formula) {
          case "4": formulaPrefix = "U1"; break;
          case "5": formulaPrefix = "U2"; break;
          case "6": formulaPrefix = "U3"; break;
        }
        
        this.calculationDetails = `${formulaPrefix} = (1 + ${k}) * ${i} * ${zzd} * ${multiplier} = ${voltage.toFixed(2)} V, Ia = ${i} * ${multiplier} = ${(i * multiplier).toFixed(2)} A`;
      }
      
      // 显示结果
      this.showResult = true;
      
      // 显示成功消息
      this.$message({
        message: "计算完成！",
        type: "success",
        duration: 2000
      });
    },
    
    // 重置表单
    resetForm() {
      this.formData.inputValue = "";
      this.formData.kValue = "";
      this.formData.phiValue = "";
      this.formData.iValue = "";
      this.formData.zzdValue = "";
      this.formData.multiplier = 0.95;
      this.showResult = false;
    }
  }
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