<template>
  <router-link :to="`/book/${book.id}`" class="book-card-link">
    <div class="book-card-container">
      <!-- 图片区域 -->
      <div class="img-wrapper">
        <img :src="book.cover" :alt="book.title" class="book-cover" loading="lazy" />
      </div>

      <!-- 信息区域 -->
      <div class="card-info">
        <h3 class="card-title">{{ book.title }}</h3>
        <p v-if="book.description" class="card-description">
          {{ formatDescription(book.description) }}
        </p>
        <p class="card-price">¥ {{ parseFloat(book.price).toFixed(2) }}</p>
      </div>
    </div>
  </router-link>
</template>

<script setup>
defineProps({
  book: {
    type: Object,
    required: true
  }
});

const formatDescription = (desc) => {
  if (!desc) return '';
  const trimmedDesc = desc.trim();
  if (trimmedDesc.length > 30) {
    return trimmedDesc.substring(0, 30) + '...';
  }
  return trimmedDesc;
};
</script>

<style scoped>
.book-card-link {
  text-decoration: none;
  display: block;
  width: 100%;
  color: inherit;
  position: relative;
  z-index: 1;
}

.book-card-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s ease;
  border: none;
  /* 移除固定高度，让内容撑开 */
  height: auto;
}

.book-card-link:hover .book-card-container {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.img-wrapper {
  width: 100%;
  height: 190px; /* 固定图片高度 */
  position: relative;
  overflow: hidden;
  background: #f9f9f9;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.card-info {
  padding: 12px 10px;
  text-align: left;
  display: flex;
  flex-direction: column;
  background: #fff;
  /* 移除固定高度，让内容自然撑开 */
  min-height: auto;
  flex: 1;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 4px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  /* 移除固定高度，由内容撑开 */
  min-height: auto;
}

.card-description {
  font-size: 12px;
  color: #606266;
  margin: 0 0 6px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  /* 移除固定高度，由内容撑开 */
  min-height: auto;
}

.card-price {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
  margin: 0;
}
</style>