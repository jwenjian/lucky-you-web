<template>
  <div id="app" :style="appStyle">
    <el-row justify="space-between" class="toolbar-row">
      <el-col :span="6" :offset="18" class="toolbar-section">
        <div class="toolbar-btn-wrapper">
          <el-button :disabled="rolling" class="toolbar-btn" circle @click="toggleSound">
            <i :class="soundBtnIcon"></i>
          </el-button>
          <span class="toolbar-btn-status">{{ soundBtnStatus }}</span>
        </div>
        <div class="toolbar-btn-wrapper">
          <el-dropdown trigger="click" @command="onLangChange">
            <el-button :disabled="rolling" class="toolbar-btn" circle>
              <i class="fas fa-globe"></i>
            </el-button>
            <span class="toolbar-btn-status">{{ $t("locale.name") }}</span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="en">🇬🇧</el-dropdown-item>
              <el-dropdown-item command="zh">🇨🇳</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>

        <div class="toolbar-btn-wrapper">
          <el-button :disabled="rolling" class="toolbar-btn" circle @click="showSettingsDialog">
            <i class="fas fa-cog"></i>
          </el-button>
          <span class="toolbar-btn-status">{{ $t("luckyYou.button.settings") }}</span>
        </div>

        <div class="toolbar-btn-wrapper">
          <el-button class="toolbar-btn" circle @click="showDonateDialog">
            <i class="fas fa-donate"></i>
          </el-button>
          <span class="toolbar-btn-status">{{ $t("luckyYou.button.donate") }}</span>
        </div>

        <div class="toolbar-btn-wrapper">
          <DarkMode @change-mode="onModeChange" :defaultMode="'dark'" :modes="['light','dark']">
            <template v-slot="{ mode }">
              <el-button class="toolbar-btn" circle v-show="mode === 'light'">
                <i class="fas fa-sun" />
              </el-button>
              <el-button class="toolbar-btn" circle v-show="mode === 'dark'">
                <i class="fas fa-moon" />
              </el-button>
            </template>
          </DarkMode>
          <span class="toolbar-btn-status">{{ modeText }}</span>
        </div>
      </el-col>
    </el-row>
    <el-row justify="space-between" class="img-row">
      <el-col :span="12" :offset="6">
        <img id="the-img" :src="imageUrl" />
      </el-col>
    </el-row>

    <el-row class="name-row">
      <el-col :span="12" :offset="6">
        <h1 id="file-name-item">{{ selectedImageFileName }}</h1>
      </el-col>
    </el-row>

    <el-row justify="center" class="btn-row">
      <el-col :span="12" :offset="6">
        <el-button
          :disabled="!readyForRoll"
          :type="btnType"
          @click="startRoll"
        >{{ startBtnText }} ({{ images.length }})</el-button>
        <el-upload
          action="https://jsonplaceholder.typicode.com/posts/"
          multiple
          :http-request="readImageFile"
          :on-success="readImageFileDone"
          :show-file-list="false"
          :file-list="fileList"
          accept=".jpg, .jpeg, .png, .gif"
        >
          <el-button :disabled="rolling" type="text">{{ $t('luckyYou.button.selectImageFolder') }}</el-button>
          <div slot="tip" class="el-upload__tip">{{ $t('luckyYou.text.imageSelectionTip') }}</div>
        </el-upload>
      </el-col>
      <el-col :span="4">
        <div class="item"></div>
      </el-col>
    </el-row>
    <footer-component></footer-component>
    <donate-dialog ref="donateDialog"></donate-dialog>
    <settings-dialog ref="settingsDialog"></settings-dialog>
  </div>
</template>

<script>
import { Howl } from "howler";
import DonateDialog from "./components/DonateDialog";
import FooterComponent from "./components/FooterComponent";
import SettingsDialog from "./components/SettingsDialog";
import { Notification } from "element-ui";

export default {
  name: "App",
  components: {
    "donate-dialog": DonateDialog,
    "footer-component": FooterComponent,
    "settings-dialog": SettingsDialog
  },
  data() {
    return {
      appStyle: {
        backgroundImage: "url('/bg.png')"
      },
      mode: "light",
      fileList: [],
      selectedImageFileName: this.$t("luckyYou.text.defaultTips"),
      imageUrl: "/casino.png",
      folderPath: null,
      images: [],
      idx: 0,
      prevIdx: 0,
      stop: false,
      itv: null,
      startBtnText: this.$t("luckyYou.button.start"),
      readyForRoll: false,
      rolling: false,
      btnType: "succcess",
      imgRowStyle: {
        backgroundImage: null
      },
      sound: {
        rolling: null,
        success: null
      },
      isPlaySound: true,
      donateDialogVisible: false,
      config: {
        common: {
          isMultiTimesChosenAllowed: true
        }
      }
    };
  },
  computed: {
    modeText() {
      return this.$t(`luckyYou.button.mode.${this.mode}`);
    },
    soundBtnIcon() {
      return this.isPlaySound ? "fas fa-volume-up" : "fas fa-volume-mute";
    },
    soundBtnStatus() {
      return this.isPlaySound
        ? this.$t("luckyYou.text.unmuted")
        : this.$t("luckyYou.text.muted");
    }
  },
  methods: {
    onModeChange(newMode) {
      this.mode = newMode;
      if (newMode === "dark") {
        this.appStyle.backgroundImage = null;
      } else {
        this.appStyle.backgroundImage = "url('/bg.png')";
      }
    },
    showSettingsDialog() {
      this.$refs["settingsDialog"] && this.$refs["settingsDialog"].showDialog();
    },
    showDonateDialog() {
      this.$refs["donateDialog"] && this.$refs["donateDialog"].showDialog();
    },
    shortenImageName(fullImageName) {
      let orig = fullImageName;
      if ("Windows" === this.getOS()) {
        if (fullImageName.indexOf("/") > 0) {
          orig = fullImageName.substr(
            fullImageName.lastIndexOf("/") + 1,
            fullImageName.length
          );
        }
        if (fullImageName.indexOf("\\") > 0) {
          orig = fullImageName.substr(
            fullImageName.lastIndexOf("\\") + 1,
            fullImageName.length
          );
        }
      }
      return orig.substr(0, orig.lastIndexOf("."));
    },
    getOS() {
      var userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
        windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
        iosPlatforms = ["iPhone", "iPad", "iPod"],
        os = null;

      if (macosPlatforms.indexOf(platform) !== -1) {
        os = "Mac OS";
      } else if (iosPlatforms.indexOf(platform) !== -1) {
        os = "iOS";
      } else if (windowsPlatforms.indexOf(platform) !== -1) {
        os = "Windows";
      } else if (/Android/.test(userAgent)) {
        os = "Android";
      } else if (!os && /Linux/.test(platform)) {
        os = "Linux";
      }

      return os;
    },
    onLangChange(lang) {
      this.$i18n.locale = lang;
      this._changeDynamicTextLang();
    },
    _changeDynamicTextLang() {
      // start button, ugly implementation, only start button text need to do this currently
      this.startBtnText = this.$t("luckyYou.button.start");
      // if the tips is default tip, then set the default tip in current lang
      if (
        this.selectedImageFileName ===
          this.$t("luckyYou.text.defaultTips", "zh") ||
        this.selectedImageFileName ===
          this.$t("luckyYou.text.defaultTips", "en")
      ) {
        this.selectedImageFileName = this.$t("luckyYou.text.defaultTips");
      }
    },
    toggleSound() {
      this.isPlaySound = !this.isPlaySound;
      let msg = this.isPlaySound
        ? this.$t("luckyYou.text.unmuted")
        : this.$t("luckyYou.text.muted");
      this.$message({
        duration: 1000,
        type: "info",
        message: msg
      });
    },
    stopRoll() {
      this.stop = true;
      clearInterval(this.itv);
      this.itv = null;
    },
    playRollingSound() {
      this.sound.rolling.play();
    },
    stopRollingSound() {
      this.sound.rolling.pause();
    },
    playSuccessSound() {
      this.sound.success.play();
    },
    showLastImageNotification() {
      // close all current notifications
      Notification.closeAll();
      const image = this.images[0];
      const h = this.$createElement;
      this.$notify({
        type: "warning",
        title: this.$t("luckyYou.message.lastImageTitle"),
        message: h("div", {}, [
          h("img", {
            attrs: { src: image.uri },
            style: { width: "80px", height: "80px" }
          }),
          h("p", {}, image.name)
        ]),
        duration: 0
      });
      this.images = [];
    },
    doStart() {
      if (this.images.length === 1) {
        this.readyForRoll = false;
        this.showLastImageNotification();
        // set rolling to true to make select image folder button available
        this.rolling = true;
        return;
      }
      if (this.isPlaySound) {
        this.playRollingSound();
      }
      this.stop = false;
      this.itv = setInterval(() => {
        this.prevIdx = this.idx;
        this.imageUrl = this.images[this.idx].uri;
        this.selectedImageFileName = this.images[this.idx].name;
        if (this.stop) {
          return;
        }
        this.idx = this.idx + 1 >= this.images.length ? 0 : this.idx + 1;
      }, 50);
      this.btnType = "danger";
      this.startBtnText = this.$t("luckyYou.button.stop");
    },
    doStop() {
      if (this.isPlaySound) {
        this.playSuccessSound();
      }
      this.stop = true;
      clearInterval(this.itv);
      if (this.isPlaySound) {
        this.stopRollingSound();
      }
      if (!this.config.common.isMultiTimesChosenAllowed) {
        this.removeChosedImage();
      }
      this.itv = null;
      this.btnType = "success";
      this.startBtnText = this.$t("luckyYou.button.start");
    },
    removeChosedImage() {
      if (this.images.length <= 1) {
        this.images = [];
        return;
      }
      const temp = this.images
        .slice(0, this.prevIdx)
        .concat(this.images.slice(this.prevIdx + 1, this.images.length));
      this.idx = Math.min(this.prevIdx, temp.length - 1);
      this.images = temp;
    },
    startRoll() {
      if (this.rolling) {
        this.doStop();
      } else {
        this.doStart();
      }
      this.rolling = !this.rolling;
    },
    arrayBufferToBase64(buffer, callback) {
      var blob = new Blob([buffer], {
        type: "application/octet-binary"
      });
      var reader = new FileReader();
      reader.onload = function(evt) {
        var dataurl = evt.target.result;
        callback(dataurl.substr(dataurl.indexOf(",") + 1));
      };
      reader.readAsDataURL(blob);
    },
    async convertFile2Image(file) {
      // [{path, is_dir, name}]

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
          resolve(e.target.result);
        };
        reader.readAsDataURL(file);
        reader.onerror = err => {
          reject(err);
        };
      });
    },
    readImageFileDone(resp, file, fileList) {
      // if file list has only 1 image, report error
      if (fileList && fileList.length <= 1) {
        this.images = [];
        this.startBtnText = this.$t("luckyYou.button.start");
        this.$message({
          duration: 2000,
          type: "error",
          message: this.$t("luckyYou.message.mustGreaterThanOneImage")
        });
        return;
      }
      // current file is the last file in file list, then all the files uploaded done
      if (file.name === fileList[fileList.length - 1].name) {
        // reload config items
        this.loadConfig();
        this.btnType = "success";
        this.startBtnText = this.$t("luckyYou.button.start");
        this.readyForRoll = true;
        this.imageUrl = "/casino.png";
        this.$message({
          duration: 1000,
          type: "success",
          message: this.$t("luckyYou.message.readDone").format(
            this.images.length
          )
        });
      }
    },
    async readImageFile(arg) {
      const file = arg.file;
      this.reset();

      this.imageUrl = "/casino.png";
      this.btnType = "";
      this.readyForRoll = false;
      this.startBtnText = this.$t("luckyYou.button.readingImage");
      const b64 = await this.convertFile2Image(file);
      this.images.push({
        path: file.name,
        uri: b64,
        name: this.shortenImageName(file.name)
      });
    },
    reset() {
      this.imageUrl = "/casino.png";
      this.selectedImageFileName = this.$t("luckyYou.text.defaultTips");
      this.imageUrl = null;
      this.idx = 0;
      this.images = [];
      this.rolling = false;
    },
    filterImages(files) {
      if (!files) {
        return [];
      }
      return files.filter(f => {
        let fname = f.name.toLowerCase();
        if (
          fname.endsWith(".jpg") ||
          fname.endsWith(".jpeg") ||
          fname.endsWith(".png")
        ) {
          return true;
        } else {
          return false;
        }
      });
    },
    loadConfig() {
      if (localStorage && localStorage.getItem("luckyYou.config")) {
        this.config = JSON.parse(localStorage.getItem("luckyYou.config"));
      } else {
        localStorage.setItem("luckyYou.config", JSON.stringify(this.config));
      }
    }
  },
  mounted() {
    this.loadConfig();
    this.sound.rolling = new Howl({
      src: ["rolling.mp3"],
      loop: true
    });
    this.sound.success = new Howl({
      src: ["success.mp3"]
    });
  }
};
</script>

<style>
:root {
  --bg: #fff;
  --color: black;
  --bg-bright: 100%;
  --bg-btn: #fff;
  --color-btn: black;
  --img-bright: 100%;
  --bg-dialog: #fff;
}
html.dark-mode {
  --bg: #121212;
  --color: #b9b9b9;
  --bg-bright: 20%;
  --bg-btn: #121212;
  --color-btn: #eee;
  --img-bright: 80%;
  --color-icon: currentColor;
  --bg-dialog: #333333;
}
html.light-mode {
  --bg: #fff;
  --color: black;
  --bg-bright: 100%;
  --bg-btn: #fff;
  --color-btn: black;
  --img-bright: 100%;
  --color-icon: currentColor;
  --bg-dialog: #fff;
}
button {
  color: var(--color-btn);
  background: var(--bg-btn);
}
img {
  filter: brightness(var(--img-bright));
}
#file-name-item {
  color: var(--color);
}
.el-dialog {
  background: var(--bg);
}
.vue-dark-mode {
  padding: 0px 0px;
  font-size: 14px;
}
html body {
  margin: 0;
  padding: 0;
  height: auto;
  background-color: var(--bg);
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--color);
  background-size: cover;
}
#the-img {
  width: 300px;
  height: 300px;
  overflow: hidden;
  margin: 0.5em auto;
  display: block;
  border: 2px #ec2d7a dashed;
  object-fit: cover;
}
#the-img:hover {
  border: 2px #207f4c dashed;
}
.name-row {
  margin-top: 0.5em;
}
.btn-row {
  margin-top: 0.5em;
}

#file-name-item {
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toolbar-row {
  margin-top: 0.5em;
}
.toolbar-btn {
  margin-left: 0.5em;
}
.toolbar-btn-status {
  display: block;
  font-size: x-small;
  font-weight: bold;
  color: #606266;
}
.toolbar-section {
  display: flex;
  justify-content: flex-end;
  padding-right: 1em;
}
.toolbar-btn-wrapper {
  margin-left: 0.5em;
  align-content: flex-end;
}
</style>
