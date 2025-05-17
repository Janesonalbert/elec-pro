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
        <span>公式计算</span>
      </div>
      
      <el-divider content-position="center">
        <i class="el-icon-star-off"></i>
      </el-divider>
      
      <div class="formula-display">
        <div class="formula-title">{{ selectedFormulaTitle }}</div>
        <div class="formula-expression">{{ selectedFormula }}</div>
      </div>
      
      <el-form :model="formData" label-width="180px" class="input-form" size="medium">
        <el-form-item :label="inputLabel">
          <el-input 
            v-model.number="formData.inputValue" 
            type="number" 
            placeholder="请输入数值"
            @input="validateInput"
          >
            <template slot="append">A</template>
          </el-input>
        </el-form-item>
        
        <!-- 倍数选择 (仅对差动I段和II段) -->
        <el-form-item label="选定倍数" v-if="showMultiplier">
          <el-radio-group v-model="formData.multiplier">
            <el-radio :label="0.95">0.95</el-radio>
            <el-radio :label="1.05">1.05</el-radio>
            <el-radio :label="1.2">1.2</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="calculateResult" 
            :disabled="!formData.inputValue"
            icon="el-icon-check"
            class="calculate-button"
          >
            校验计算
          </el-button>
          <el-button 
            @click="resetForm" 
            icon="el-icon-refresh"
          >
            重置
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
        <el-alert
          title="计算完成"
          type="success"
          :closable="false"
          show-icon
          style="margin-bottom: 15px"
        >
          校验计算已完成，请查看下方结果。
        </el-alert>
        
        <!-- 正常态表格 -->
        <div class="table-title">正常态</div>
        <el-table
          :data="normalStateData"
          border
          style="width: 100%"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
          }"
        >
          <el-table-column prop="name" label="参数" width="100" align="center"></el-table-column>
          <el-table-column prop="ua" label="Ua" align="center"></el-table-column>
          <el-table-column prop="ub" label="Ub" align="center"></el-table-column>
          <el-table-column prop="uc" label="Uc" align="center"></el-table-column>
          <el-table-column prop="ia" label="Ia" align="center"></el-table-column>
          <el-table-column prop="ib" label="Ib" align="center"></el-table-column>
          <el-table-column prop="ic" label="Ic" align="center"></el-table-column>
        </el-table>
        
        <!-- 故障态表格 -->
        <div class="table-title" style="margin-top: 20px">故障态</div>
        <el-table
          :data="faultStateData"
          border
          style="width: 100%"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
          }"
        >
          <el-table-column prop="name" label="参数" width="100" align="center"></el-table-column>
          <el-table-column prop="ua" label="Ua" align="center"></el-table-column>
          <el-table-column prop="ub" label="Ub" align="center"></el-table-column>
          <el-table-column prop="uc" label="Uc" align="center"></el-table-column>
          <el-table-column prop="ia" label="Ia" align="center">
            <template slot-scope="scope">
              <span :class="{ 'highlight-value': scope.row.name === '幅值/相位' }">{{ scope.row.ia }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="ib" label="Ib" align="center"></el-table-column>
          <el-table-column prop="ic" label="Ic" align="center"></el-table-column>
        </el-table>
        
        <!-- 计算详情 -->
        <div class="calculation-details" v-if="calculationDetails">
          <div class="details-title">计算详情</div>
          <div class="details-content">
            <p><strong>使用公式：</strong>{{ selectedFormula }}</p>
            <p><strong>输入参数：</strong>{{ inputLabel }} = {{ formData.inputValue }} A</p>
            <p v-if="showMultiplier"><strong>选定倍数：</strong>{{ formData.multiplier }}</p>
            <p><strong>计算结果：</strong>{{ calculationDetails }}</p>
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
      level1Options: [
        { value: "1", label: "差动保护校验" },
        { value: "2", label: "接地距离保护校验" },
        { value: "3", label: "相间距离保护校验" },
        { value: "4", label: "零序保护校验" },
        { value: "5", label: "听线相过流保护校验" }
      ],
      level2Options: [],
      formData: {
        level1Formula: "",
        level2Formula: "",
        inputValue: "",
        multiplier: 0.95
      },
      showResult: false,
      normalStateData: [
        {
          name: "幅值/相位",
          ua: "57.74∠0°V",
          ub: "57.74∠-120°V",
          uc: "57.74∠120°V",
          ia: "0∠0°A",
          ib: "0∠-120°A",
          ic: "0∠120°A"
        }
      ],
      faultStateData: [
        {
          name: "幅值/相位",
          ua: "57.74∠0°V",
          ub: "57.74∠-120°V",
          uc: "57.74∠120°V",
          ia: "0∠0°A", // 将被计算结果替换
          ib: "0∠-120°A",
          ic: "0∠120°A"
        }
      ],
      calculationDetails: ""
    };
  },
  computed: {
    // 是否显示倍数选择
    showMultiplier() {
      return this.formData.level2Formula === "1" || this.formData.level2Formula === "2";
    },
    // 当前选择的公式标题
    selectedFormulaTitle() {
      if (!this.formData.level2Formula) return "";
      
      const formulaTitles = {
        "1": "差动I段校验",
        "2": "差动II段校验",
        "3": "零序差动校验"
      };
      
      return formulaTitles[this.formData.level2Formula] || "";
    },
    // 当前选择的公式表达式
    selectedFormula() {
      if (!this.formData.level2Formula) return "";
      
      const formulas = {
        "1": "I1＝0.5*1.5*Icdqd1",
        "2": "I2＝0.5*Icdqd2",
        "3": "I＝0.78*0.5*Icdqd0    I0＝1.1＊0.5*Icdqd0"
      };
      
      return formulas[this.formData.level2Formula] || "";
    },
    // 输入框标签
    inputLabel() {
      if (!this.formData.level2Formula) return "";
      
      const labels = {
        "1": "差动动作电流Icdqd1",
        "2": "差动动作电流Icdqd2",
        "3": "差动动作电流Icdqd0"
      };
      
      return labels[this.formData.level2Formula] || "";
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
      } else {
        this.level2Options = [];
      }
    },
    
    // 处理二级公式变化
    handleLevel2Change() {
      this.formData.inputValue = "";
      this.showResult = false;
    },
    
    // 验证输入
    validateInput() {
      if (isNaN(this.formData.inputValue) || this.formData.inputValue <= 0) {
        this.formData.inputValue = "";
      }
    },
    
    // 计算结果
    calculateResult() {
      let result = 0;
      
      // 根据公式计算
      switch (this.formData.level2Formula) {
        case "1": // 差动I段校验
          result = 0.5 * 1.5 * this.formData.inputValue;
          result = result * this.formData.multiplier; // 应用倍数
          this.calculationDetails = `I1 = 0.5 * 1.5 * ${this.formData.inputValue} * ${this.formData.multiplier} = ${result.toFixed(2)} A`;
          break;
        case "2": // 差动II段校验
          result = 0.5 * this.formData.inputValue;
          result = result * this.formData.multiplier; // 应用倍数
          this.calculationDetails = `I2 = 0.5 * ${this.formData.inputValue} * ${this.formData.multiplier} = ${result.toFixed(2)} A`;
          break;
        case "3": // 零序差动校验
          let i = 0.78 * 0.5 * this.formData.inputValue;
          let i0 = 1.1 * 0.5 * this.formData.inputValue;
          result = i; // 使用I值作为结果
          this.calculationDetails = `I = 0.78 * 0.5 * ${this.formData.inputValue} = ${i.toFixed(2)} A, I0 = 1.1 * 0.5 * ${this.formData.inputValue} = ${i0.toFixed(2)} A`;
          break;
      }
      
      // 更新故障态表格中的Ia值
      this.faultStateData[0].ia = `${result.toFixed(2)}∠0°A`;
      
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

.result-card {
  margin-bottom: 30px; /* 添加底部外边距 */
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.selection-area,
.formula-display,
.result-area {
  padding: 10px 0;
}

.formula-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.formula-expression {
  font-family: 'Courier New', monospace;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 16px;
  color: #409eff;
  border-left: 4px solid #409eff;
}

.input-form {
  margin-top: 20px;
}

.calculate-button {
  margin-right: 10px;
}

.table-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
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

.highlight-value {
  color: #f56c6c;
  font-weight: bold;
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