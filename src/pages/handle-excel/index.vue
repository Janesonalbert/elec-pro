<template>
  <div direction="vertical" class="excel-container">
    <div class="main-card">

      <!-- 上传区域 -->
      <transition name="el-fade-in-linear">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card shadow="hover" class="upload-area">
              <div class="upload-title">
                <i class="el-icon-upload animated-icon"></i>
                <span>上传Excel文件</span>
              </div>
              <el-divider content-position="center">
                <i class="el-icon-star-off"></i>
              </el-divider>
              <el-upload
                class="upload-excel"
                drag
                action="https://jsonplaceholder.typicode.com/posts/"
                :on-success="handleSuccess"
                :on-error="handleError"
                :before-upload="beforeUpload"
                accept=".xlsx, .xls"
                :file-list="fileList"
                :auto-upload="true"
                :limit="1"
              >
                <i class="el-icon-upload pulse-icon"></i>
                <div class="el-upload__text">
                  将Excel文件拖到此处，或<em>点击上传</em>
                </div>
                <div slot="tip" class="el-upload__tip">
                  <i class="el-icon-info"></i> 只能上传Excel文件（.xlsx,
                  .xls），且不超过10MB
                </div>
              </el-upload>
            </el-card>
          </el-col>
        </el-row>
      </transition>

      <!-- 操作区域 -->
      <transition name="el-zoom-in-top">
        <el-row :gutter="20" style="margin-top: 20px" v-if="fileUploaded">
          <el-col :span="24">
            <el-card shadow="hover" class="action-area">
              <div class="action-title">
                <i class="el-icon-s-operation animated-icon"></i> 文件操作
              </div>
              <el-divider content-position="center">
                <i class="el-icon-star-off"></i>
              </el-divider>
              <div class="action-content">
                <el-button
                  type="primary"
                  @click="processExcel"
                  :loading="processing"
                  icon="el-icon-s-tools"
                  class="process-button"
                >
                  {{ processing ? "处理中..." : "处理Excel" }}
                </el-button>
                <transition name="el-fade-in">
                  <el-tag v-if="uploadedFile" type="success" class="file-tag">
                    <i class="el-icon-document"></i> {{ uploadedFile.name }}
                  </el-tag>
                </transition>
              </div>
              <div class="file-info" v-if="uploadedFile">
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="文件名">
                    <el-tooltip :content="uploadedFile.name" placement="top">
                      <span class="ellipsis">{{ uploadedFile.name }}</span>
                    </el-tooltip>
                  </el-descriptions-item>
                  <el-descriptions-item label="文件大小">
                    {{ (uploadedFile.size / 1024).toFixed(2) }} KB
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </transition>

      <!-- 结果展示区域 -->
      <transition name="el-zoom-in-bottom">
        <el-row :gutter="20" style="margin-top: 20px" v-if="processResult">
          <el-col :span="24">
            <el-card shadow="hover" class="result-area">
              <div slot="header" class="result-header">
                <span
                  ><i class="el-icon-data-analysis animated-icon"></i>
                  处理结果</span
                >
                <div>
                  <el-tooltip content="下载处理后的文件" placement="top">
                    <el-button
                      type="primary"
                      size="small"
                      icon="el-icon-download"
                      @click="downloadProcessedFile"
                      class="download-button"
                    >
                      下载文件
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="刷新数据" placement="top">
                    <el-button
                      type="info"
                      size="small"
                      icon="el-icon-refresh"
                      @click="processExcel"
                      :loading="processing"
                      plain
                    >
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
              <div class="result-content">
                <el-alert
                  title="处理完成"
                  type="success"
                  :closable="false"
                  show-icon
                  style="margin-bottom: 15px"
                >
                  Excel文件已成功处理，可以查看结果或下载处理后的文件。
                </el-alert>

                <!-- Excel表格展示 - 修改数据源为paginatedData -->
                <el-table
                  :data="paginatedData"
                  style="width: 100%"
                  v-if="processedData.length"
                  border
                  stripe
                  max-height="400px"
                  :header-cell-style="{
                    background: '#f5f7fa',
                    color: '#606266',
                  }"
                  highlight-current-row
                  @row-click="handleRowClick"
                >
                  <el-table-column
                    v-for="(col, index) in tableColumns"
                    :key="index"
                    :prop="col.prop"
                    :label="col.label"
                    :width="col.width || ''"
                    :formatter="col.formatter"
                    align="center"
                    show-overflow-tooltip
                  >
                  </el-table-column>
                </el-table>
                <el-empty v-else description="暂无数据"></el-empty>

                <div class="table-pagination" v-if="processedData.length > 10">
                  <el-pagination
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                    :current-page="currentPage"
                    :page-sizes="[10, 20, 50, 100]"
                    :page-size="pageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="processedData.length"
                  >
                  </el-pagination>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </transition>

      <!-- 底部信息 -->
      <el-divider content-position="center" v-if="processResult">
        <i class="el-icon-success"></i>
      </el-divider>
      <div class="footer-info" v-if="processResult">
        <el-tag size="small" type="info" effect="plain"
          >处理时间: {{ new Date().toLocaleString() }}</el-tag
        >
      </div>
    </div>
  </div>
</template>

<script>
// 导入xlsx库用于处理Excel文件
import * as XLSX from "xlsx";

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
      workbook: null, // Excel工作簿对象
      currentPage: 1, // 当前页码
      pageSize: 10, // 每页显示条数
      selectedRow: null, // 选中的行
    };
  },
  computed: {
    // 添加计算属性获取当前页数据
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.processedData.slice(start, end);
    },
  },
  methods: {
    // 上传前验证
    beforeUpload(file) {
      // 验证文件类型
      const isExcel =
        file.type === "application/vnd.ms-excel" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls");

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

      // 使用通知提示
      this.$notify({
        title: "上传成功",
        message: "文件已成功上传，可以进行处理",
        type: "success",
        duration: 2000,
        position: "top-right",
      });

      // 读取上传的Excel文件
      this.readExcelFile(file.raw);
    },

    // 读取Excel文件内容
    readExcelFile(file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          this.workbook = XLSX.read(data, { type: "array" });

          // 获取第一个工作表
          const firstSheetName = this.workbook.SheetNames[0];
          const worksheet = this.workbook.Sheets[firstSheetName];

          // 将工作表转换为JSON
          this.rawExcelData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          });

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
          this.$notify({
            title: "处理成功",
            message: "Excel文件已成功处理，可以查看结果或下载",
            type: "success",
            duration: 3000,
            position: "top-right",
          });
          this.processing = false;
          this.currentPage = 1; // 重置页码
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
          width: this.calculateColumnWidth(index),
        };
      });

      // 处理数据行（从第二行开始）
      this.processedData = this.rawExcelData.slice(1).map((row) => {
        const rowData = {};
        // 将每行数据转换为对象
        headers.forEach((header, index) => {
          rowData[`col${index}`] = row[index] !== undefined ? row[index] : "";
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

      this.rawExcelData.forEach((row) => {
        if (row[columnIndex]) {
          const cellValue = String(row[columnIndex]);
          maxLength = Math.max(maxLength, cellValue.length);
        }
      });

      // 根据最大长度设置列宽（每个字符约8px，最小80px）
      return Math.max(80, maxLength * 8) + "px";
    },

    // 生成处理后的Excel文件
    generateProcessedExcel() {
      // 创建新的工作簿
      const newWorkbook = XLSX.utils.book_new();

      // 将处理后的数据转换回适合Excel的格式
      const excelData = [
        // 表头
        this.tableColumns.map((col) => col.label),
        // 数据行
        ...this.processedData.map((row) => {
          return this.tableColumns.map((col) => row[col.prop]);
        }),
      ];

      // 创建工作表
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);

      // 将工作表添加到工作簿
      XLSX.utils.book_append_sheet(newWorkbook, worksheet, "处理后数据");

      // 生成Excel文件的二进制数据
      const excelBuffer = XLSX.write(newWorkbook, {
        bookType: "xlsx",
        type: "array",
      });

      // 创建Blob对象
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // 生成下载链接
      this.processedFileUrl = URL.createObjectURL(blob);
    },

    // 下载处理后的文件
    downloadProcessedFile() {
      if (!this.processedFileUrl) {
        this.$message.warning("没有可下载的文件！");
        return;
      }

      const fileName =
        "processed_" +
        (this.uploadedFile ? this.uploadedFile.name : "excel.xlsx");

      // 显示下载中提示
      this.$message({
        message: "文件下载中...",
        type: "info",
        duration: 1000,
      });

      const link = document.createElement("a");
      link.href = this.processedFileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 下载完成提示
      setTimeout(() => {
        this.$message({
          message: "文件下载完成",
          type: "success",
          duration: 1500,
        });
      }, 1000);
    },

    // 添加或完善分页方法
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1; // 切换每页显示数量时重置为第一页
    },

    handleCurrentChange(page) {
      this.currentPage = page;
    },

    // 处理行点击事件
    handleRowClick(row) {
      this.selectedRow = row;
      // 可以添加行选中的提示
      this.$message({
        message: `已选中: ${Object.values(row)[0]}`,
        type: "info",
        duration: 1500,
      });
    },
  },
  // 组件销毁前清理资源
  beforeDestroy() {
    if (this.processedFileUrl) {
      URL.revokeObjectURL(this.processedFileUrl);
    }
  },
};
</script>

<style scoped>
.excel-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.main-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin: 20px;
  border-radius: 8px;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.upload-area,
.action-area,
.result-area {
  border-radius: 8px;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  overflow: hidden;
}

.upload-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-excel {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.action-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-content {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.file-tag {
  margin-left: 15px;
  transition: all 0.3s;
}

.result-area {
  border-radius: 8px;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-content {
  min-height: 100px;
  overflow-x: auto;
  padding: 10px 0;
}

.table-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.footer-info {
  display: flex;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 10px;
}

.file-info {
  margin-top: 15px;
}

.ellipsis {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

/* 悬停效果 */
.upload-area:hover,
.action-area:hover,
.result-area:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-3px);
}

/* 按钮动效 */
.process-button:hover,
.download-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.process-button,
.download-button {
  transition: all 0.3s;
}

/* 图标动效 */
.animated-icon {
  transition: all 0.3s;
  margin-right: 5px;
}

.animated-icon:hover {
  transform: scale(1.2);
  color: #409eff;
}

.pulse-icon {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* 自定义过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* 表格行悬停效果 */
/deep/ .el-table__row:hover {
  background-color: #f0f9ff !important;
  transition: background-color 0.3s;
}

/* 分隔线样式 */
/deep/ .el-divider__text {
  background-color: transparent;
}
</style>
