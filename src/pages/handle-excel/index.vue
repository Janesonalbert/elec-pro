<template>
    <div>
      <el-upload
        action="https://jsonplaceholder.typicode.com/posts/"
        :on-success="handleSuccess"
        :on-error="handleError"
        :before-upload="beforeUpload"
        accept=".xlsx, .xls"
        :file-list="fileList"
        :auto-upload="true"
        :limit="1"
      >
        <el-button type="primary">点击上传Excel文件</el-button>
        <div slot="tip" class="el-upload__tip">只能上传Excel文件（.xlsx, .xls）</div>
      </el-upload>
  
      <!-- 上传成功后显示处理按钮 -->
      <div v-if="fileUploaded" style="margin-top: 20px">
        <el-button type="success" @click="processExcel" :loading="processing">
          {{ processing ? '处理中...' : '处理Excel' }}
        </el-button>
      </div>
  
      <!-- 处理结果展示区域 -->
      <div v-if="processResult" style="margin-top: 20px">
        <el-card class="result-card">
          <div slot="header">
            <span>处理结果</span>
            <el-button 
              style="float: right; padding: 3px 0" 
              type="text"
              @click="downloadProcessedFile"
            >
              下载处理后的文件
            </el-button>
          </div>
          <div class="result-content">
            <!-- Excel表格展示 -->
            <el-table 
              :data="processedData" 
              style="width: 100%" 
              v-if="processedData.length"
              border
              stripe
              max-height="500"
            >
              <el-table-column 
                v-for="(col, index) in tableColumns" 
                :key="index" 
                :prop="col.prop" 
                :label="col.label"
                :width="col.width || ''"
                :formatter="col.formatter"
              >
              </el-table-column>
            </el-table>
            <div v-else>
              {{ processResult }}
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </template>
  
  <script>
  // 导入xlsx库用于处理Excel文件
  import * as XLSX from 'xlsx';
  
  export default {
    name: "HandleExcel",
    data() {
      return {
        fileList: [], // 上传的文件列表
        fileUploaded: false, // 是否已上传文件
        uploadedFile: null, // 上传的文件对象
        processing: false, // 是否正在处理
        processResult: "", // 处理结果信息
        processedData: [], // 处理后的数据
        tableColumns: [], // 表格列配置
        processedFileUrl: "", // 处理后文件的下载链接
        rawExcelData: null, // 原始Excel数据
        workbook: null // Excel工作簿对象
      };
    },
    methods: {
      // 上传前验证
      beforeUpload(file) {
        // 验证文件类型
        const isExcel = 
          file.type === "application/vnd.ms-excel" || 
          file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.name.endsWith('.xlsx') || 
          file.name.endsWith('.xls');
        
        if (!isExcel) {
          this.$message.error("只能上传Excel文件！");
          return false;
        }
        
        // 验证文件大小（限制为10MB）
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
          this.$message.error("文件大小不能超过10MB！");
          return false;
        }
        
        return true;
      },
      
      // 上传成功处理
      handleSuccess(response, file, fileList) {
        console.log("上传成功:", response, file);
        this.fileUploaded = true;
        this.uploadedFile = file;
        this.fileList = fileList;
        this.$message.success("文件上传成功！");
        
        // 读取上传的Excel文件
        this.readExcelFile(file.raw);
      },
      
      // 读取Excel文件内容
      readExcelFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            this.workbook = XLSX.read(data, { type: 'array' });
            
            // 获取第一个工作表
            const firstSheetName = this.workbook.SheetNames[0];
            const worksheet = this.workbook.Sheets[firstSheetName];
            
            // 将工作表转换为JSON
            this.rawExcelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            console.log("Excel数据读取成功:", this.rawExcelData);
          } catch (error) {
            console.error("Excel文件读取失败:", error);
            this.$message.error("Excel文件读取失败，请检查文件格式！");
          }
        };
        
        reader.onerror = (error) => {
          console.error("文件读取错误:", error);
          this.$message.error("文件读取错误，请重试！");
        };
        
        reader.readAsArrayBuffer(file);
      },
      
      // 上传失败处理
      handleError(err) {
        console.error("上传失败:", err);
        this.$message.error("文件上传失败，请重试！");
      },
      
      // 处理Excel文件
      processExcel() {
        if (!this.uploadedFile || !this.rawExcelData) {
          this.$message.warning("请先上传Excel文件！");
          return;
        }
        
        this.processing = true;
        
        // 模拟处理过程
        setTimeout(() => {
          try {
            // 处理Excel数据
            this.processExcelData();
            
            this.processResult = "Excel文件处理完成！";
            this.processing = false;
          } catch (error) {
            console.error("处理Excel文件失败:", error);
            this.$message.error("处理Excel文件失败，请重试！");
            this.processing = false;
          }
        }, 1000);
      },
      
      // 处理Excel数据
      processExcelData() {
        if (!this.rawExcelData || this.rawExcelData.length === 0) {
          throw new Error("Excel数据为空");
        }
        
        // 获取表头（第一行）
        const headers = this.rawExcelData[0];
        
        // 生成表格列配置
        this.tableColumns = headers.map((header, index) => {
          return {
            prop: `col${index}`,
            label: header || `列${index + 1}`,
            width: this.calculateColumnWidth(index)
          };
        });
        
        // 处理数据行（从第二行开始）
        this.processedData = this.rawExcelData.slice(1).map(row => {
          const rowData = {};
          // 将每行数据转换为对象
          headers.forEach((header, index) => {
            rowData[`col${index}`] = row[index] !== undefined ? row[index] : '';
          });
          return rowData;
        });
        
        // 生成处理后的Excel文件
        this.generateProcessedExcel();
      },
      
      // 计算列宽度
      calculateColumnWidth(columnIndex) {
        // 这里可以根据数据内容长度动态计算列宽
        // 简单实现：检查所有行该列的最大字符长度
        let maxLength = 0;
        
        this.rawExcelData.forEach(row => {
          if (row[columnIndex]) {
            const cellValue = String(row[columnIndex]);
            maxLength = Math.max(maxLength, cellValue.length);
          }
        });
        
        // 根据最大长度设置列宽（每个字符约8px，最小80px）
        return Math.max(80, maxLength * 8) + 'px';
      },
      
      // 生成处理后的Excel文件
      generateProcessedExcel() {
        // 这里可以对数据进行自定义处理
        // 注：和厚泰福商定目前只是简单地复制原始数据，后续可以在此添加更复杂的处理
        
        // 创建新的工作簿
        const newWorkbook = XLSX.utils.book_new();
        
        // 将处理后的数据转换回适合Excel的格式
        const excelData = [
          // 表头
          this.tableColumns.map(col => col.label),
          // 数据行
          ...this.processedData.map(row => {
            return this.tableColumns.map(col => row[col.prop]);
          })
        ];
        
        // 创建工作表
        const worksheet = XLSX.utils.aoa_to_sheet(excelData);
        
        // 将工作表添加到工作簿
        XLSX.utils.book_append_sheet(newWorkbook, worksheet, "处理后数据");
        
        // 生成Excel文件的二进制数据
        const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
        
        // 创建Blob对象
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // 生成下载链接
        this.processedFileUrl = URL.createObjectURL(blob);
      },
      
      // 下载处理后的文件
      downloadProcessedFile() {
        if (!this.processedFileUrl) {
          this.$message.warning("没有可下载的文件！");
          return;
        }
        
        const fileName = "processed_" + (this.uploadedFile ? this.uploadedFile.name : "excel.xlsx");
        
        const link = document.createElement("a");
        link.href = this.processedFileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };
  </script>
  
  <style scoped>
  .result-card {
    margin-top: 20px;
  }
  .result-content {
    min-height: 100px;
    overflow-x: auto;
  }
  </style>