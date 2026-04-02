<template>
	<div class="cart-page">
		<!-- 头部表头区 -->
		<div class="cart-table-header">
			<div class="col col-check"><el-checkbox v-model="allSelected" @change="toggleAllSelection">全选</el-checkbox></div>
			<div class="col col-info">商品信息</div>
			<div class="col col-price">单价 (元)</div>
			<div class="col col-qty">数量</div>
			<div class="col col-subtotal">金额 (元)</div>
			<div class="col col-action">操作</div>
		</div>

		<!-- 商品列表区 -->
		<div class="cart-body">
			<div v-if="cartItems.length === 0" class="empty-cart">
				<el-empty description="购物车还是空的，快去挑选好书吧！" />
			</div>

			<div v-else class="cart-items-list">
				<div v-for="item in cartItems" :key="item.id" class="cart-item-row">
					<!-- 1. 勾选框 -->
					<div class="col col-check">
						<el-checkbox :model-value="selectedIds.includes(item.id)" @change="(checked) => toggleSelect(item.id, checked)"></el-checkbox>
					</div>

					<!-- 2. 商品信息 (图片+标题+简介) -->
					<div class="col col-info">
						<div class="info-inner" @click="openDetail(item)">
							<img :src="item.cover" :alt="item.title" class="thumb" />
							<div class="info-text">
								<div class="title">{{ item.title }}</div>
								<!-- 这里修改了：显示简介字段 -->
								<div class="desc-text">
									{{ item.productDescription || '暂无商品简介' }}
								</div>
							</div>
						</div>
					</div>

					<!-- 3. 单价 -->
					<div class="col col-price">
						<div class="price-box">
							<span class="price">¥{{ formatPrice(item.price) }}</span>
						</div>
					</div>

					<!-- 4. 数量 -->
					<div class="col col-qty">
						<div class="qty-box" @click.stop>
							<el-input-number
								v-model="item.quantity"
								:min="1"
								:max="100"
								size="small"
								@change="(val) => updateQuantity(item.id, val)"
							/>
						</div>
					</div>

					<!-- 5. 小计 -->
					<div class="col col-subtotal">
						<div class="subtotal-box">
							<span class="total-price">¥{{ ((item.quantity || 1) * (Number(item.price) || 0)).toFixed(2) }}</span>
						</div>
					</div>

					<!-- 6. 操作 -->
					<div class="col col-action">
						<div class="action-box">
							<el-button type="text" class="btn-delete" @click="removeFromCart(item.id)">删除</el-button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 底部结算栏 -->
		<div class="cart-footer">
			<div class="footer-left">
				<el-button type="text" @click="batchDelete" :disabled="!selectedIds.length" class="btn-batch">批量删除</el-button>
				<span class="selected-info">已选择 <strong>{{ selectedCount }}</strong> 件商品</span>
			</div>

			<div class="footer-right">
				<div class="total-label">总计(不含运费): <span class="total-amount">¥{{ selectedTotal.toFixed(2) }}</span></div>
				<el-button type="danger" class="btn-checkout" @click="checkout">结算</el-button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/utils/request';
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const cartItemsRef = ref([]);
const selectedIds = ref([]);

const cartItems = computed(() => cartItemsRef.value);
const selectedItems = computed(() => cartItemsRef.value.filter(i => selectedIds.value.includes(i.id)));
const selectedCount = computed(() => selectedItems.value.reduce((sum, item) => sum + (item.quantity || 1), 0));
const selectedTotal = computed(() => selectedItems.value.reduce((s, it) => s + (Number(it.price || 0) * (it.quantity || 1)), 0));

const allSelected = computed({
	get: () => cartItemsRef.value.length > 0 && selectedIds.value.length === cartItemsRef.value.length,
	set: (val) => { selectedIds.value = val ? cartItemsRef.value.map(i => i.id) : []; }
});

const fetchCartList = async () => {
	try {
		const res = await request.get('/user/shopping-cart/list');
		if (Array.isArray(res)) {
			cartItemsRef.value = res.map(it => ({
				...it,
				quantity: it.number ?? it.quantity ?? 1,
				title: it.productName || it.title || it.bookName || `商品-${it.productId || it.id}`,
				cover: it.productImage || it.productImageUrl || it.cover || '/images/default-cover.jpg',
				price: typeof it.price === 'number' ? it.price : (it.price ? Number(it.price) : 0),
                // 关键修改：将后端返回的 productDescription 映射出来
				productDescription: it.productDescription || ''
			}));
		} else {
			cartItemsRef.value = [];
		}
	} catch (e) {
		console.error('获取购物车失败', e);
		cartItemsRef.value = [];
	}
};

onMounted(() => { fetchCartList(); window.addEventListener('user-updated', fetchCartList); });
onBeforeUnmount(() => { window.removeEventListener('user-updated', fetchCartList); });

const formatPrice = (p) => (typeof p === 'number' ? p.toFixed(2) : Number(p || 0).toFixed(2));

const toggleSelect = (id, checked) => {
	if (checked) { if (!selectedIds.value.includes(id)) selectedIds.value.push(id); }
	else selectedIds.value = selectedIds.value.filter(x => x !== id);
};

const toggleAllSelection = (val) => { allSelected.value = val; };

// 数量改变时触发
const updateQuantity = async (id, val) => {
    try {
        await request.put('/user/shopping-cart/update', null, { params: { id, number: val } });
    } catch (e) { console.error(e); }
};

const removeFromCart = async (id) => {
	try {
        await ElMessageBox.confirm('确定要删除该商品吗？', '提示', { type: 'warning' });
		await request.delete('/user/shopping-cart/delete', { params: { Id: id } });
		await fetchCartList();
		ElMessage.success('已删除');
	} catch (e) { console.error(e); }
};

const batchDelete = async () => {
	try {
        if (!selectedIds.value.length) return;
        await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 件商品吗？`, '提示', { type: 'warning' });
		await request.delete('/user/shopping-cart/deleteBatch', { params: { ids: selectedIds.value } });
		selectedIds.value = [];
		await fetchCartList();
		ElMessage.success('批量删除成功');
	} catch (e) { console.error(e); }
};

const checkout = () => {
	if (selectedCount.value === 0) {
        ElMessage.warning('请先选择商品');
        return;
    }
	ElMessageBox.confirm(`确认结算 ${selectedCount.value} 件商品，合计 ¥${selectedTotal.value.toFixed(2)}？`, '确认订单', { confirmButtonText: '去结算', cancelButtonText: '再看看', type: 'warning' })
		.then(() => {
            ElMessage.success('正在跳转到结算页...');
        })
		.catch(() => {});
};

const openDetail = (item) => {
    const bookId = item.productId || item.id;
    if (!bookId) return;
    router.push({ name: 'BookDetail', params: { id: bookId } });
};
</script>

<style scoped>
/* 整体容器 */
.cart-page {
	max-width: 1200px;
	margin: 20px auto;
	background: #fff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* --- 表格表头 --- */
.cart-table-header {
	display: grid;
	grid-template-columns: 50px 480px 120px 160px 140px 100px;
	align-items: center;
	padding: 16px 20px;
	background: #f9f9f9;
	border-bottom: 1px solid #ddd;
	color: #333;
	font-size: 16px;
	font-weight: bold;
}

/* --- 列表行 --- */
.cart-item-row {
	display: grid;
	grid-template-columns: 50px 480px 120px 160px 140px 100px;
	align-items: center;
	padding: 20px;
	border-bottom: 1px solid #f0f0f0;
	transition: background 0.2s;
}

.cart-item-row:hover {
	background: #fcfcfc;
}

/* --- 通用列样式 --- */
.col { display: flex; align-items: center; }
.col-check { justify-content: center; }

/* 商品信息列 */
.col-info { padding-left: 10px; }
.info-inner { display: flex; cursor: pointer; }
.thumb {
	width: 80px;
	height: 80px;
	object-fit: cover;
	border: 1px solid #eee;
	margin-right: 15px;
}
.info-text { display: flex; flex-direction: column; justify-content: center; flex: 1; overflow: hidden; }
.title { 
    font-size: 16px; 
    color: #333; 
    margin-bottom: 8px; 
    line-height: 1.4;
    /* 多行文本省略的兼容性支持 */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
}

/* 简介文本样式：限制两行，超出省略 */
.desc-text {
    font-size: 12px;
    color: #999;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 380px;
}

/* 单价列 */
.col-price { justify-content: center; color: #999; font-size: 14px; }
.price { font-size: 14px; }

/* 数量列 */
.col-qty { justify-content: center; }
.qty-box :deep(.el-input-number) { width: 120px; }

/* 小计列 */
.col-subtotal { justify-content: center; }
.total-price { color: #f40; font-size: 18px; font-weight: bold; font-family: 'Arial'; }

/* 操作列 */
.col-action { justify-content: center; }
.btn-delete { color: #999; font-size: 14px; }
.btn-delete:hover { color: #f40; }

/* --- 底部结算栏 --- */
.cart-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 20px;
	margin-top: 20px;
	border-top: 2px solid #f40;
	background: #fff;
}

.footer-left { display: flex; align-items: center; gap: 15px; font-size: 14px; color: #666; }
.btn-batch { color: #666; }
.btn-batch:hover { color: #f40; }
.selected-info strong { color: #f40; font-size: 16px; margin: 0 4px; }

.footer-right { display: flex; align-items: center; gap: 20px; }
.total-label { font-size: 14px; color: #999; }
.total-amount { font-size: 24px; color: #f40; font-weight: bold; font-family: 'Arial'; }
.btn-checkout {
	background: #f40;
	color: #fff;
	padding: 12px 30px;
	font-size: 16px;
	border-radius: 4px;
	border: none;
}
.btn-checkout:hover { background: #e03000; }
</style>