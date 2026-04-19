<template>
  <div class="book-detail-page" v-loading="loading">
    <!-- 书籍信息 -->
    <div class="book-detail-container" v-if="book">
      <!-- 左侧：媒体展示区 -->
      <div class="media-section">
        <!-- 主图展示 -->
        <div class="main-image-wrapper">
          <img 
            :src="currentImage" 
            :alt="book.bookName" 
            class="main-image" 
            @error="(e)=>e.target.src='/images/new.png'"
          />
        </div>
        <!-- 缩略图轮播 -->
        <div class="thumbnail-carousel" v-if="sliderImages.length > 0">
          <div class="thumbnail-container">
            <div 
              v-for="(image, index) in sliderImages" 
              :key="index"
              class="thumbnail-item"
              @click="currentIndex = index"
            >
              <img 
                :src="image" 
                :alt="`${book.bookName} - 缩略图${index + 1}`" 
                class="thumbnail-image" 
                :class="{ active: currentIndex === index }"
                @error="(e)=>e.target.src='/images/new.png'"
              />
            </div>
          </div>
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

        <!-- 领券区域 -->
        <div class="coupon-section" v-if="book.couponTemplates && book.couponTemplates.length > 0">
          <div class="coupon-header" @click="openCouponDialog">
            <span class="coupon-title">领券</span>
            <div class="coupon-list">
              <div 
                v-for="(coupon, index) in book.couponTemplates.slice(0, 3)" 
                :key="coupon.id || index" 
                class="coupon-item"
              >
                <span class="coupon-value">
                  {{ coupon.type === 1 ? `满${coupon.minOrderAmount}减${coupon.discountValue}` : `${coupon.discountValue}折` }}
                </span>
              </div>
              <div v-if="book.couponTemplates.length > 3" class="coupon-more" @click.stop>
                <span>更多</span>
              </div>
            </div>
          </div>
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
          <!-- 动态属性 -->
          <div class="attributes-section" v-if="attributes.length > 0">
            <div class="attribute-item" v-for="(attr, index) in attributes" :key="index">
              <span class="attribute-label">{{ attr.name }}：</span>
              <span class="attribute-value">{{ attr.value }}</span>
            </div>
          </div>
          <!-- 富文本详情 -->
          <div class="detail-content" v-html="book.detailHtml || '暂无详情'"> </div>
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

    <!-- 优惠券弹窗 -->
    <el-dialog v-model="showCouponDialog" title="领券" :width="dialogWidth" :append-to-body="true">
      <div v-loading="checkingCoupons" class="coupon-dialog-content">
        <div class="coupon-grid" v-if="couponJudgments.length > 0" :style="{ '--cols': couponColumns }">
          <div 
            v-for="(coupon, index) in couponJudgments" 
            :key="coupon.id || index" 
            class="coupon-card"
          >
            <div class="coupon-content">
              <div class="coupon-left">
                <span class="coupon-amount-card">{{ coupon.type === 1 ? `¥${coupon.discountValue}` : `${coupon.discountValue}折` }}</span>
                <div class="coupon-condition">{{ coupon.type === 1 ? `满${coupon.minOrderAmount}可用` : '' }}</div>
              </div>
              <div class="coupon-right">
                <div class="coupon-info">
                  <span class="coupon-type-card">{{ coupon.type === 1 ? '满减券' : '折扣券' }}</span>
                  <span class="coupon-scope-card">{{ getCouponScope(coupon.scope) }}</span>
                </div>
                <div class="coupon-validity">有效期: {{ formatCouponDate(coupon.validStartTime) }}至{{ formatCouponDate(coupon.validEndTime) }}</div>
              </div>
            </div>
            <div class="coupon-footer-card">
              <el-button 
                :type="coupon.isLimit === 1 ? 'primary' : 'default'" 
                :disabled="coupon.isLimit === 0"
                @click="claimCoupon(coupon)"
              >
                {{ coupon.isLimit === 1 ? '立即领取' : '已领取' }}
              </el-button>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无可用优惠券" />
      </div>
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

// 优惠券弹窗状态
const showCouponDialog = ref(false)
const couponJudgments = ref([])
const checkingCoupons = ref(false)
const dialogWidth = ref('280px')
const couponColumns = ref(1)

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

// 解析轮播图
const sliderImages = computed(() => {
  if (!book.value || !book.value.sliderImages) return [];
  try {
    const images = JSON.parse(book.value.sliderImages);
    return Array.isArray(images) ? images : [images];
  } catch (e) {
    return [book.value.sliderImages];
  }
});

// 解析动态属性
const attributes = computed(() => {
  if (!book.value || !book.value.attributes) return [];
  try {
    const attrs = JSON.parse(book.value.attributes);
    if (Array.isArray(attrs)) {
      // 确保每个属性对象都有name和value属性
      return attrs.map(attr => {
        if (attr.key && !attr.name) {
          return { ...attr, name: attr.key };
        }
        return attr;
      });
    }
    return [];
  } catch (e) {
    return [];
  }
});

// 当前选中的图片索引
const currentIndex = ref(0);

// 当前显示的主图
const currentImage = computed(() => {
  if (sliderImages.value.length > 0) {
    return sliderImages.value[currentIndex.value] || sliderImages.value[0];
  }
  return book.value?.coverUrl || '/images/new.png';
});

// 处理缩略图轮播变化
const handleThumbnailChange = (index) => {
  currentIndex.value = index;
};

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

// 格式化优惠券日期
const formatCouponDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

// 获取优惠券使用范围
const getCouponScope = (scope) => {
  switch (scope) {
    case 1:
      return '全场通用';
    case 2:
      return '特价专区可用';
    case 3:
      return '新书专区可用';
    default:
      return '';
  }
};

// 打开优惠券弹窗
const openCouponDialog = async () => {
  if (!book.value || !book.value.couponTemplates || book.value.couponTemplates.length === 0) {
    return;
  }
  
  checkingCoupons.value = true;
  try {
    // 提取优惠券ID集合
    const couponIds = book.value.couponTemplates.map(coupon => coupon.id);
    // 发送请求查看优惠券领取限制，使用第一个优惠券ID作为路径参数
    const firstCouponId = couponIds[0] || 0;
    const res = await request.post(`/user/book/limit/${firstCouponId}`, couponIds);
    couponJudgments.value = res || [];
    
    // 计算弹窗宽度，根据优惠券数量自动调整（使用 CSS Grid 列数控制）
    const couponWidth = 280; // 每个优惠券的宽度
    const gap = 20; // 优惠券之间的间距
    const cols = Math.min(Math.max(couponJudgments.value.length, 1), 2); // 最多 2 列，至少 1 列
    couponColumns.value = cols;
    const dialogPadding = 32; // 弹窗左右内边距
    const extraSpacing = 24; // 比刚好包裹内容略多出的宽度，避免显得太贴边
    dialogWidth.value = `${couponWidth * cols + gap * (cols - 1) + dialogPadding + extraSpacing}px`;
    
    showCouponDialog.value = true;
  } catch (error) {
    console.error('获取优惠券领取限制失败:', error);
    ElMessage.error('获取优惠券信息失败');
  } finally {
    checkingCoupons.value = false;
  }
};

// 领取优惠券
const claimCoupon = async (coupon) => {
  try {
    // 调用后端领取优惠券接口
    await request.post(`/user/book/coupon/${coupon.id}`);
    ElMessage.success('优惠券领取成功');
    // 更新优惠券状态
    const index = couponJudgments.value.findIndex(item => item.id === coupon.id);
    if (index !== -1) {
      couponJudgments.value[index].isLimit = 0;
    }
  } catch (error) {
    console.error('领取优惠券失败:', error);
    ElMessage.error('领取优惠券失败');
  }
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
    // 后端已修改为GET请求，使用query参数传递
    const params = { productId: id, quantity: quantity.value, source: 'buynow' };
    const res = await request.get('/user/book/buy', { params });
    const vo = res || {};
    const buy = vo.buy || {};
    const item = {
      id: buy.productId || id,
      productId: buy.productId || id,
      title: buy.bookName || book.value.bookName || book.value.title,
      price: Number(buy.price || vo.totalPrice || book.value.price) || 0,
      quantity: buy.quantity || quantity.value,
      cover: buy.coverUrl || book.value.coverUrl || book.value.cover || '/images/new.png',
      description: buy.description || book.value.description || ''
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
    router.push({ name: 'CreateOrder', query: { bookId: id, quantity: quantity.value, source: 'buynow' } });
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
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.main-image-wrapper {
  width: 320px;
  height: 320px;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  position: relative;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: #fff;
}

.thumbnail-carousel {
  width: 320px;
  margin-top: 15px;
  overflow: hidden;
}

.thumbnail-container {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
  scrollbar-width: thin;
  scrollbar-color: #ccc #f5f5f5;
}

.thumbnail-container::-webkit-scrollbar {
  height: 6px;
}

.thumbnail-container::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.thumbnail-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.thumbnail-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.thumbnail-item {
  flex-shrink: 0;
  width: 54px;
  height: 54px;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.thumbnail-image:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.thumbnail-image.active {
  border-color: #ff5000;
  box-shadow: 0 2px 8px rgba(255, 80, 0, 0.3);
}

/* 领券区域 */
.coupon-section {
  margin-top: 20px;
  margin-bottom: 20px;
  width: 100%;
}

.coupon-header {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: background 0.2s;
}

.coupon-header:hover {
  background: #f5f5f5;
}

.coupon-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-right: 15px;
  white-space: nowrap;
}

.coupon-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex: 1;
}

.coupon-item {
  background: url('/Coupon/C3.jpg') no-repeat center center;
  background-size: cover;
  border: none;
  border-radius: 16px;
  padding: 8px 16px;
  font-size: 12px;
  color: #fff;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.coupon-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.coupon-more {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  padding: 8px 16px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
}

.coupon-more:hover {
  background: #e0e0e0;
}

/* 优惠券弹窗 */
.coupon-dialog-content {
  padding: 20px 0;
}

.coupon-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), 280px);
  justify-content: start;
  gap: 20px;
}

.coupon-card {
  background: url('/Coupon/C2.jpg') no-repeat center center;
  background-size: cover;
  border: none;
  border-radius: 8px;
  width: 280px;
  height: 94px;
  padding: 12px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.coupon-content {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  flex: 1;
}

.coupon-left {
  flex: 1;
}

.coupon-amount-card {
  font-size: 20px;
  font-weight: bold;
  color: #ff5000;
  margin-bottom: 4px;
}

.coupon-condition {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.coupon-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.coupon-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.coupon-type-card {
  font-size: 10px;
  color: #fff;
  background: #ff5000;
  padding: 1px 6px;
  border-radius: 8px;
  display: inline-block;
}

.coupon-scope-card {
  font-size: 10px;
  color: #666;
  background: #f5f5f5;
  padding: 1px 6px;
  border-radius: 8px;
  display: inline-block;
}

.coupon-validity {
  font-size: 10px;
  color: #999;
}

.coupon-footer-card {
  width: 100%;
  display: flex;
  justify-content: center;
}

.coupon-footer-card .el-button {
  width: 180px;
  height: 28px;
  border-radius: 14px;
  background: #409eff;
  border: none;
  color: #fff;
  font-size: 12px;
  padding: 0;
}

.coupon-footer-card .el-button:hover {
  background: #66b1ff;
}

.coupon-footer-card .el-button:disabled {
  background: #c0c4cc;
  color: #fff;
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

.attributes-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 20px;
}

.attribute-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.attribute-label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
  min-width: 100px;
}

.attribute-value {
  color: #303133;
  flex: 1;
}

.detail-content {
  line-height: 1.8;
  color: #606266;
  font-size: 15px;
  text-align: justify;
  padding: 20px;
}

.detail-content img {
  max-width: 100%;
  height: auto;
  margin: 10px 0;
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