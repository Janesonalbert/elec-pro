<template>
  <div class="home-container">
    <!-- 顶部标题区域 -->
    <div class="header-section">
      <div class="logo-container">
        <i class="el-icon-s-platform animated-icon"></i>
        <span class="app-title">新站建设的辅助类工作和基于标签打印尺寸自动匹配平台</span>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧导航菜单 - 宽度减小 -->
      <div class="side-menu">
        <el-menu
          :default-active="activeIndex"
          class="menu-vertical"
          @select="handleSelect"
          background-color="#f5f7fa"
          text-color="#303133"
          active-text-color="#409EFF"
        >
          <el-menu-item index="1" class="menu-item">
            <i class="el-icon-s-opportunity"></i>
            <span slot="title">保护校验辅助计算</span>
          </el-menu-item>
          <el-menu-item index="2" class="menu-item">
            <i class="el-icon-document"></i>
            <span slot="title">表格格式规范优化</span>
          </el-menu-item>
        </el-menu>

        <!-- 底部装饰 -->
        <div class="menu-footer">
          <el-divider content-position="center">
            <i class="el-icon-star-off"></i>
          </el-divider>
          <div class="footer-text">
            <i class="el-icon-time"></i> {{ currentTime }}
          </div>
        </div>
      </div>

      <!-- 右侧内容区域 - 扩大并添加滚动 -->
      <div class="content-area">
        <div class="content-card" shadow="hover">
          <!-- 内容标题 -->
          <div slot="header" class="content-header">
            <div class="header-left">
              <i :class="activeIcon" class="animated-icon"></i>
              <span>{{ activeTitle }}</span>
            </div>
            <el-button-group>
              <el-tooltip content="刷新" placement="top">
                <el-button
                  size="small"
                  icon="el-icon-refresh"
                  @click="refreshContent"
                ></el-button>
              </el-tooltip>
              <el-tooltip content="帮助" placement="top">
                <el-button
                  size="small"
                  icon="el-icon-question"
                  @click="showHelp"
                ></el-button>
              </el-tooltip>
            </el-button-group>
          </div>

          <!-- 内容区域 - 添加滚动容器 -->
          <div class="scrollable-content">
            <transition name="el-fade-in-linear" mode="out-in">
              <keep-alive>
                <component
                  :is="currentComponent"
                  :key="activeIndex"
                ></component>
              </keep-alive>
            </transition>
          </div>
        </div>
      </div>
    </div>

    <!-- 帮助对话框 -->
    <el-dialog
      title="使用帮助"
      :visible.sync="helpDialogVisible"
      width="50%"
      center
    >
      <div class="help-content">
        <div v-if="activeIndex === '1'">
          <h3><i class="el-icon-s-opportunity"></i> 公式计算模块</h3>
          <p>本模块提供各种电力计算公式，选择相应的公式类型进行计算。</p>
          <ul>
            <li>差动保护校验</li>
            <li>接地距离保护校验</li>
            <li>相间距离保护校验</li>
            <li>零序保护校验</li>
            <li>听线相过流保护校验</li>
          </ul>
        </div>
        <div v-else>
          <h3><i class="el-icon-document"></i> Excel处理模块</h3>
          <p>本模块提供Excel文件的上传、处理和下载功能。</p>
          <ol>
            <li>上传Excel文件（支持.xlsx和.xls格式）</li>
            <li>点击"处理Excel"按钮进行数据处理</li>
            <li>查看处理结果并下载处理后的文件</li>
          </ol>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="helpDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import ElecClac from "../elec-clac/index.vue";
import HandleExcel from "../handle-excel/index.vue";

export default {
  components: {
    ElecClac,
    HandleExcel,
  },
  data() {
    return {
      activeIndex: "1",
      helpDialogVisible: false,
      currentTime: new Date().toLocaleTimeString(),
    };
  },
  computed: {
    currentComponent() {
      return this.activeIndex === "1" ? "ElecClac" : "HandleExcel";
    },
    activeTitle() {
      return this.activeIndex === "1" ? "保护校验辅助计算" : "表格格式规范优化";
    },
    activeIcon() {
      return this.activeIndex === "1"
        ? "el-icon-s-opportunity"
        : "el-icon-document";
    },
  },
  methods: {
    handleSelect(key) {
      this.activeIndex = key;
    },
    refreshContent() {
      // 刷新当前内容
      this.$message({
        message: "内容已刷新",
        type: "success",
        duration: 1500,
      });
      // 这里可以添加实际的刷新逻辑
    },
    showHelp() {
      this.helpDialogVisible = true;
    },
    updateTime() {
      this.currentTime = new Date().toLocaleTimeString();
    },
  },
  mounted() {
    // 启动时钟更新
    this.timer = setInterval(this.updateTime, 1000);
  },
  beforeDestroy() {
    // 清除定时器
    clearInterval(this.timer);
  },
};
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw; /* 确保占满整个视口宽度 */
  position: fixed; /* 固定位置，防止滚动 */
  top: 0;
  left: 0;
  background-color: #f0f2f5;
}

.header-section {
  background: linear-gradient(90deg, #1976d2, #2196f3);
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.logo-container {
  display: flex;
  align-items: center;
}

.app-title {
  font-size: 20px;
  font-weight: bold;
  margin-left: 10px;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  overflow-y: auto;
}

.side-menu {
  width: 180px; /* 减小宽度 */
  height: 100%;
  background-color: #f5f7fa;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 5;
}

.menu-vertical {
  border-right: none;
}

.menu-item {
  margin: 8px 0;
  border-radius: 4px;
  transition: all 0.3s;
}

.menu-item:hover {
  background-color: #ecf5ff !important;
  transform: translateX(5px);
}

.menu-footer {
  padding: 10px;
  text-align: center;
  color: #909399;
}

.footer-text {
  font-size: 12px;
  margin-top: 5px;
}

.content-area {
  flex: 1;
  padding: 20px;
  overflow: hidden; /* 修改为hidden，内部内容滚动 */
  display: flex;
  flex-direction: column;
}

.content-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  transition: all 0.3s;
  overflow: hidden; /* 确保内容不溢出 */
  background-color: #fff;
}

.content-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 新增滚动容器 */
.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  margin-left: 20px;
  margin-top: 10px;
}

.header-left {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.animated-icon {
  margin-right: 8px;
  transition: all 0.3s;
}

.animated-icon:hover {
  transform: scale(1.2);
  color: #409eff;
}

/* 帮助对话框样式 */
.help-content {
  padding: 10px;
  line-height: 1.6;
}

.help-content h3 {
  color: #409eff;
  margin-bottom: 15px;
}

.help-content ul,
.help-content ol {
  padding-left: 20px;
  margin-top: 10px;
}

.help-content li {
  margin-bottom: 8px;
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

/* 滚动条美化 */
.scrollable-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollable-content::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.scrollable-content::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.scrollable-content::-webkit-scrollbar-corner {
  background: #f5f7fa;
}
</style>
