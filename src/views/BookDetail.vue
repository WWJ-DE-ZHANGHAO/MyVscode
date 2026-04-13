<template>
  <div class="book-detail-page" v-loading="loading">
    <!-- 书籍信息 -->
    <div class="book-detail-container" v-if="book">
      <!-- 左侧：媒体展示区 -->
      <div class="media-section">
        <div class="media-player-wrapper">
          <video 
            v-if="book.videoUrl" 
            ref="videoPlayer"
            controls 
            class="book-video"
            preload="metadata"
            :poster="book.coverUrl" 
          >
            <source :src="book.videoUrl" type="video/mp4" />
            您的浏览器不支持 Video 标签。
          </video>
          <img 
            v-else 
            :src="book.coverUrl || '/images/new.png'" 
            :alt="book.bookName" 
            class="book-cover-large" 
            @error="(e)=>e.target.src='/images/new.png'"
          />
        </div>
        <div class="play-hint" v-if="book.videoUrl">
          <i class="el-icon-video-play"></i> 点击播放书籍介绍视频
        </div>
      </div>

      <!-- 右侧：信息购买区 -->
      <div class="info-section">
        <h1 class="book-title-main">{{ book.bookName }}</h1>
        
        <div class="meta-info">
          <span class="author">作者：{{ book.author }}</span>
          <span class="price">¥ {{ parseFloat(book.price).toFixed(2) }}</span>
        </div>
        
        <!-- 评分（只读） -->
        <div class="rating">
          <el-rate 
            :model-value="ratingScore" 
            disabled 
            show-score 
            :colors="['#F7BA2A', '#F7BA2A', '#F7BA2A']"
            :texts="['1分', '2分', '3分', '4分', '5分']"
          />
          <span class="score-number">{{ book.score ? book.score.toFixed(1) : '暂无评分' }}</span>
          <span class="comment-count">{{ commentList.length }} 条评价</span>
        </div>

        <!-- 批量购买组件 -->
        <div class="quantity-selector">
          <span class="label">购买数量：</span>
          <div class="custom-quantity">
            <button 
              class="quantity-btn quantity-btn-left" 
              @click="increaseQuantity"
              :disabled="!hasStock || quantity >= maxQuantity"
            >
              +
            </button>
            <input 
              type="number" 
              v-model.number="quantity" 
              class="quantity-input"
              :min="1" 
              :max="maxQuantity"
              :disabled="!hasStock"
              @input="handleQuantityInput"
            />
            <button 
              class="quantity-btn quantity-btn-right" 
              @click="decreaseQuantity"
              :disabled="!hasStock || quantity <= 1"
            >
              -
            </button>
          </div>
          <span class="stock-status" :class="{ 'out-of-stock': !hasStock }">
            {{ hasStock ? '有货' : '无货' }}
          </span>
        </div>

        <div class="actions">
          <el-button 
            :type="hasStock ? 'primary' : ''" 
            size="large" 
            round 
            @click="buyNow"
            :disabled="!hasStock"
            :style="{ backgroundColor: hasStock ? '' : '#CCCCCC', borderColor: hasStock ? '' : '#CCCCCC' }"
          >
            {{ hasStock ? '立即购买' : '补货中' }}
          </el-button>
          <el-button 
            size="large" 
            round 
            @click="addToCart"
            :disabled="!hasStock"
            :style="{ backgroundColor: hasStock ? '' : '#CCCCCC', borderColor: hasStock ? '' : '#CCCCCC' }"
          >
            {{ hasStock ? '加入购物车' : '售罄' }}
          </el-button>
        </div>

        <!-- 内容简介 -->
        <div class="description-section">
          <h3>内容简介</h3>
          <p class="book-desc">{{ book.description || '暂无简介' }}</p>
        </div>
      </div>
    </div>

    <!-- 加载中或未找到 -->
    <div v-else-if="!loading" class="loading-or-not-found">
      <el-empty description="未找到该书籍" />
    </div>

    <!-- 底部选项卡：商品详情 + 商品评价 -->
    <div class="detail-tabs" v-if="book">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="商品详情" name="detail">
          <div class="detail-content" v-html="book.detailContent || '暂无详情'"></div>
        </el-tab-pane>
        <el-tab-pane label="商品评价" name="comment">
          <div class="comment-list" v-if="commentList.length > 0">
            <div v-for="comment in commentList" :key="comment.id" class="comment-item">
              <div class="comment-header">
                <!-- 修复1：size 改为合法值 default -->
                <el-avatar :src="comment.avatar || defaultAvatar" size="default" />
                <div class="user-info">
                  <span class="username">{{ comment.username }}</span>
                  <el-rate :model-value="comment.score" disabled :colors="['#F7BA2A', '#F7BA2A', '#F7BA2A']" />
                  <span class="time">{{ formatDate(comment.createTime) }}</span>
                </div>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
              <!-- 修复2：图片显示条件判断，确保有图片时才渲染 -->
              <div class="comment-images" v-if="comment.images && parseImages(comment.images).length > 0">
                <el-image 
                  v-for="(img, idx) in parseImages(comment.images)" 
                  :key="idx"
                  :src="img" 
                  :preview-src-list="parseImages(comment.images)"
                  :initial-index="idx"
                  fit="cover"
                  class="comment-img"
                />
              </div>
              
              <!-- 商家回复 -->
              <div class="merchant-reply" v-if="comment.replyContent && comment.replyTime">
                <div class="reply-header">
                  <span class="reply-label">商家回复</span>
                  <span class="reply-time">{{ formatDate(comment.replyTime) }}</span>
                </div>
                <div class="reply-content">{{ comment.replyContent }}</div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无评价" />
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 评价弹窗 -->
    <el-dialog v-model="showCommentDialog" title="提交评价" width="640px" :append-to-body="true">
      <div style="margin-bottom:8px">
        <el-rate v-model="commentForm.score" :colors="['#F7BA2A','#F7BA2A','#F7BA2A']" />
      </div>
      <el-form label-width="0">
        <el-form-item>
          <el-input type="textarea" :rows="6" placeholder="写下你的评价" v-model="commentForm.content" />
        </el-form-item>
        <el-form-item label="上传图片">
          <el-upload
            action="/user/upload/upload"
            list-type="picture-card"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemoveImage"
            :limit="5"
            accept="image/*"
          >
            <i class="el-icon-plus"></i>
          </el-upload>
          <div style="color:#999;font-size:12px;margin-top:8px">请上传至少一张图片（最多5张）</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCommentDialog = false">取消</el-button>
        <el-button type="primary" @click="submitComment">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import request from '@/utils/request';
import { loadAddressList as apiLoadAddressList } from '@/composables/useAddress';
const emit = defineEmits(['add-to-cart']);
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { forceHideTooltip } from '@/directives/bookTooltip';

const route = useRoute();
const router = useRouter();

// 数据状态
const loading = ref(true);
const book = ref(null);
const commentList = ref([]);
const quantity = ref(1);      // 购买数量
const activeTab = ref('detail'); // 当前选项卡

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// 评论弹窗状态与表单
const showCommentDialog = ref(false)
const commentForm = ref({
  OrderDetailId: null,
  content: '',
  images: [],
  score: 5
})
const uploadingCommentImages = ref(false)

// 计算是否有货（库存>0 视为有货）
const hasStock = computed(() => {
  return book.value && book.value.stock > 0;
});

// 计算最大可购买数量（有货时取库存，无货时为0）
const maxQuantity = computed(() => {
  return hasStock.value ? (book.value.stock || 999) : 0;
});

// 计算评分（用于展示）
const ratingScore = computed(() => {
  if (book.value && book.value.score) {
    // 四舍五入到整数（因为 el-rate 只接受整数）
    return Math.round(book.value.score);
  }
  return 0;
});

// 数量增加方法
const increaseQuantity = () => {
  if (quantity.value < maxQuantity.value) {
    quantity.value++;
  }
};

// 数量减少方法
const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

// 输入框手动输入校验
const handleQuantityInput = () => {
  if (quantity.value < 1) {
    quantity.value = 1;
  }
  if (quantity.value > maxQuantity.value) {
    quantity.value = maxQuantity.value;
  }
  quantity.value = Math.floor(quantity.value);
};

// 获取书籍详情
const fetchBookDetail = async (id) => {
  try {
    const res = await request.get(`/user/book/${id}`);
    book.value = res;
    console.log('书籍详情:', book.value);
    quantity.value = 1; // 重置数量
  } catch (error) {
    console.error('获取书籍详情失败:', error);
    ElMessage.error('获取书籍信息失败');
    book.value = null;
  }
};

// 获取评价列表
const fetchComments = async (productId) => {
  try {
    const res = await request.get(`/user/comment/${productId}`);
    commentList.value = Array.isArray(res) ? res : [];
    console.log('评价列表:', commentList.value);
  } catch (error) {
    console.error('获取评价列表失败:', error);
    commentList.value = [];
  }
};

// 格式化时间
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
};

// 解析评价图片：兼容后端返回的数组、JSON 字符串或单个 URL
const parseImages = (images) => {
  if (!images) return [];
  // 如果已经是数组，直接返回
  if (Array.isArray(images)) return images;
  // 如果是字符串，尝试解析 JSON 字符串，否则当作单个 URL 返回
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return [images];
    }
  }
  // 其他类型，转换为字符串后返回
  return [String(images)];
};

// 购买逻辑
const buyNow = async () => {
  if (!hasStock.value) {
    ElMessage.warning('商品已售罄，无法购买');
    return;
  }
  try {
    const id = book.value.id;
    // 后端当前期望通过请求体接收（@RequestBody UserBuyNow），因此使用 POST 到 /user/book/buy
    const res = await request.post('/user/book/buy', { productId: id, quantity: quantity.value });
    const vo = res || {};
    const item = {
      id: vo.productId || id,
      title: vo.bookName || book.value.bookName || book.value.title,
      price: Number(vo.price || vo.totalPrice || book.value.price) || 0,
      quantity: vo.quantity || quantity.value,
      cover: vo.coverUrl || book.value.coverUrl || book.value.cover || '/images/new.png',
      description: vo.description || book.value.description || ''
    };
    // 保存为支持的结构：{ buyNows: [...], activityDiscount, originalTotal }
    const checkoutPayload = {
      buyNows: [item],
      activityDiscount: (vo && typeof vo.activityDiscount !== 'undefined') ? vo.activityDiscount : null,
      originalTotal: (vo && typeof vo.originalTotal !== 'undefined') ? vo.originalTotal : null
    };
    sessionStorage.setItem('checkoutItems', JSON.stringify(checkoutPayload));
    // 在跳转前请求地址列表，确保后端返回最新地址供结算页使用，并把数据缓存到 sessionStorage 供结算页快速渲染
    try {
      const addresses = await apiLoadAddressList();
      if (Array.isArray(addresses) && addresses.length) {
        sessionStorage.setItem('prefetchedAddressList', JSON.stringify(addresses));
      }
    } catch (e) { console.warn('预加载地址失败', e); }

    // 预取运费模板列表并缓存，供结算页快速渲染运费方案
    try {
      const tpl = await request.get('/user/shipping-template/list');
      if (Array.isArray(tpl) && tpl.length) {
        sessionStorage.setItem('prefetchedShippingTemplates', JSON.stringify(tpl));
      }
    } catch (e) {
      console.warn('预加载运费模板失败', e);
    }
    router.push({ name: 'CreateOrder', query: { source: 'buyNow' } });
  } catch (e) {
    console.error('立即购买接口调用失败', e);
    ElMessage.error('无法获取商品信息，请稍后重试');
  }
};

// 加入购物车
const addToCart = async () => {
  if (!hasStock.value) {
    ElMessage.warning('商品已售罄，无法加入购物车');
    return;
  }
  try {
    // 调用后端保存购物车接口
    await request.post('/user/shopping-cart/save', {
      productId: book.value.id,
      number: quantity.value
    });
    ElMessage.success('已加入购物车');
    // 通知父布局更新本地展示（MainLayout 通过 @add-to-cart 捕获）
    emit('add-to-cart', {
      id: book.value.id,
      title: book.value.bookName || book.value.title,
      price: book.value.price || 0,
      quantity: quantity.value,
      cover: book.value.coverUrl || book.value.cover
    });
  } catch (error) {
    ElMessage.error('加入购物车失败');
  }
};

// 选项卡切换
const handleTabClick = () => {};

// 页面加载
onMounted(async () => {
  const id = route.params.id;
  if (!id) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    await Promise.all([
      fetchBookDetail(id),
      fetchComments(id)
    ]);
  } catch (err) {
    console.error('加载失败:', err);
  } finally {
    loading.value = false;
  }
  // 若路由带有 comment=1，则打开评价弹窗（携带 orderDetailId）
  if (route.query && route.query.comment === '1' && route.query.orderDetailId) {
    // 填充表单并打开
    commentForm.value.OrderDetailId = Number(route.query.orderDetailId)
    showCommentDialog.value = true
    // 切换到评价 tab
    activeTab.value = 'comment'
  }
});

onUnmounted(() => {
  forceHideTooltip();
});

// 监听路由 query 变化，若用户通过“去评价”跳转过来，打开弹窗
watch(() => route.query, (q) => {
  if (q && q.comment === '1' && q.orderDetailId) {
    commentForm.value.OrderDetailId = Number(q.orderDetailId)
    showCommentDialog.value = true
    activeTab.value = 'comment'
  }
})

// 上传成功处理（EditProfileDialog 中的逻辑参考）
const handleUploadSuccess = (response, file) => {
  // 后端可能返回字符串或 { data: path }
  const path = (typeof response === 'string') ? response : (response && (response.data || response.filePath || response.url) ? (response.data || response.filePath || response.url) : null)
  if (path) {
    commentForm.value.images.push(path)
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.success('图片上传完成（请确认返回值）')
  }
}

const handleRemoveImage = (file, fileList) => {
  // file.response 可能包含已上传的路径
  const resp = file.response
  const path = resp ? (typeof resp === 'string' ? resp : (resp.data || resp.filePath || resp.url)) : (file.url || file.responseUrl)
  if (path) commentForm.value.images = commentForm.value.images.filter(p => p !== path)
}

const submitComment = async () => {
  try {
    if (!commentForm.value.content || commentForm.value.content.trim().length === 0) { ElMessage.error('评价内容不能为空'); return }
    if (!commentForm.value.images || commentForm.value.images.length === 0) { ElMessage.error('请上传至少一张图片'); return }
    const payload = {
      // 注意：后端 DTO 字段名为 OrderDetailId（首字母大写），按此字段发送
      OrderDetailId: Number(commentForm.value.OrderDetailId),
      content: commentForm.value.content,
      images: commentForm.value.images,
      score: Number(commentForm.value.score || 5)
    }
    await request.post('/user/comment/submint', payload)
    ElMessage.success('提交评价成功')
    showCommentDialog.value = false
    // 清除路由中的 comment 参数，避免重复弹出
    router.replace({ query: Object.assign({}, route.query, { comment: undefined, orderDetailId: undefined }) })
    // 重新拉取评价列表
    await fetchComments(book.value.id)
  } catch (e) {
    console.error('submitComment failed', e)
    ElMessage.error('提交评价失败')
  }
}
</script>

<style scoped>
.book-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.book-detail-container {
  display: flex;
  gap: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  padding: 30px;
  margin-bottom: 30px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 左侧媒体区 */
.media-section {
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.media-player-wrapper {
  width: 200px;
  height: 200px;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  position: relative;
}

.book-video, .book-cover-large {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #fff;
}

.play-hint {
  margin-top: 15px;
  color: #909399;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 右侧信息区 */
.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.book-title-main {
  font-size: 28px;
  margin-bottom: 15px;
  color: #303133;
  line-height: 1.4;
}

.meta-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.author {
  font-size: 16px;
  color: #606266;
}

.price {
  color: #f56c6c;
  font-weight: bold;
  font-size: 24px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.score-number {
  font-size: 14px;
  color: #F7BA2A;
  font-weight: bold;
}

.comment-count {
  font-size: 13px;
  color: #909399;
}

/* 数量选择器样式 */
.quantity-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.quantity-selector .label {
  font-size: 14px;
  color: #606266;
}

.custom-quantity {
  display: flex;
  align-items: center;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.quantity-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f7fa;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.quantity-btn:hover:not(:disabled) {
  background: #e6e8eb;
}

.quantity-btn:disabled {
  cursor: not-allowed;
  color: #c0c4cc;
}

.quantity-btn-left {
  border-right: 1px solid #dcdfe6;
}

.quantity-btn-right {
  border-left: 1px solid #dcdfe6;
}

.quantity-input {
  width: 60px;
  height: 32px;
  border: none;
  text-align: center;
  font-size: 14px;
  outline: none;
}

.quantity-input::-webkit-outer-spin-button,
.quantity-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.stock-status {
  font-size: 14px;
  color: #67c23a;
  font-weight: 500;
}

.stock-status.out-of-stock {
  color: #f56c6c;
}

.actions {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.description-section h3 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #303133;
  font-weight: 600;
}

.book-desc {
  line-height: 1.8;
  color: #606266;
  font-size: 15px;
  text-align: justify;
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}

.loading-or-not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

/* 底部选项卡 */
.detail-tabs {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  padding: 20px;
}

.detail-content {
  line-height: 1.8;
  color: #606266;
  font-size: 15px;
  text-align: justify;
  padding: 20px;
}

.comment-list {
  max-height: 600px;
  overflow-y: auto;
  padding: 10px;
}

.comment-item {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 0;
}

.comment-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username {
  font-weight: 500;
  color: #303133;
}

.time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  margin: 12px 0;
  line-height: 1.5;
  color: #606266;
}

.comment-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.comment-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

/* 商家回复样式 */
.merchant-reply {
  margin-top: 15px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.reply-label {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

.reply-time {
  font-size: 12px;
  color: #909399;
}

.reply-content {
  line-height: 1.5;
  color: #606266;
  font-size: 14px;
}
</style>