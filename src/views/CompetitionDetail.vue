<template>
  <div v-if="competition" class="competition-detail animate-fade-in space-y-6">
    <!-- Header bar -->
    <div class="flex items-center gap-4">
      <router-link to="/competitions" class="btn-ghost w-8 h-8 flex items-center justify-center rounded-lg">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </router-link>
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold truncate">{{ competition.name }}</h2>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="competition.status === 'participating' && competition.directory"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:text-green-400 hover:bg-green-500/10 transition-colors"
          title="导出比赛文件"
          @click="exportCompetition"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
          </svg>
          导出
        </button>
        <button
          v-if="competition.status !== 'participating' && competition.status !== 'finished'"
          class="btn-primary text-sm"
          @click="handleParticipate"
        >
          参加比赛
        </button>
        <span
          v-else-if="competition.status === 'participating'"
          class="px-3 py-1.5 rounded-lg text-sm font-medium"
          :class="competition.solved ? 'bg-green-500/15 text-green-400' : 'bg-purple-500/15 text-purple-400'"
        >
          {{ competition.solved ? '已解决' : '已参加' }}
        </span>
        <a
          v-if="competition.url"
          :href="competition.url"
          target="_blank"
          class="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-blue-400 transition-colors"
        >
          CTFtime ↗
        </a>
      </div>
    </div>

    <!-- Competition info cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="card py-3">
        <p class="text-xs text-[var(--text-muted)] mb-1">日期</p>
        <p class="text-sm font-medium">{{ formatDateRange(competition.start_date, competition.end_date) }}</p>
      </div>
      <div class="card py-3">
        <p class="text-xs text-[var(--text-muted)] mb-1">时长</p>
        <p class="text-sm font-medium">{{ getDuration(competition.start_date, competition.end_date) }}</p>
      </div>
      <div class="card py-3">
        <p class="text-xs text-[var(--text-muted)] mb-1">赛制</p>
        <p class="text-sm font-medium">{{ competition.format || '—' }}</p>
      </div>
      <div class="card py-3">
        <p class="text-xs text-[var(--text-muted)] mb-1">权重</p>
        <p class="text-sm font-medium">{{ competition.weight > 0 ? competition.weight.toFixed(1) : '—' }}</p>
      </div>
    </div>

    <!-- Status & dates timeline -->
    <div class="card py-3">
      <div class="flex items-center gap-6 text-sm">
        <div>
          <span class="text-[var(--text-muted)]">开始：</span>
          <span class="font-mono">{{ formatFullDate(competition.start_date) }}</span>
        </div>
        <div>
          <span class="text-[var(--text-muted)]">结束：</span>
          <span class="font-mono">{{ formatFullDate(competition.end_date) }}</span>
        </div>
        <div>
          <span class="text-[var(--text-muted)]">状态：</span>
          <span class="px-2 py-0.5 rounded text-xs font-medium" :class="statusBadgeClass(competition.status)">
            {{ statusLabel(competition.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- File sections + Challenges (only visible when participating) -->
    <template v-if="competition.status === 'participating' && competition.directory">
      <!-- Challenge progress -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">题目进度</h3>
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium" :class="progress.solved === progress.total && progress.total > 0 ? 'text-green-400' : 'text-[var(--text-secondary)]'">
              {{ progress.solved }} / {{ progress.total }} 已解决
            </span>
          </div>
        </div>
        <!-- Progress bar -->
        <div v-if="progress.total > 0" class="w-full h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="progress.percent === 100 ? 'bg-green-500' : progress.percent > 0 ? 'bg-yellow-500' : 'bg-slate-600'"
            :style="{ width: progress.percent + '%' }"
          />
        </div>
        <p v-else class="text-xs text-[var(--text-muted)]">还没有创建题目 — 点击下方按钮添加</p>
      </div>

      <!-- Challenges by category -->
      <div v-for="(challenges, category) in challengeStore.byCategory" :key="category" class="card">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{{ category }}</span>
            <span class="text-xs text-[var(--text-muted)]">
              {{ chStore.getCategoryProgress(competition.id!, category).solved }} /
              {{ chStore.getCategoryProgress(competition.id!, category).total }}
            </span>
          </div>
        </div>

        <!-- Challenge rows -->
        <div class="space-y-1">
          <div
            v-for="ch in challenges"
            :key="ch.id"
            class="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
          >
            <!-- Status toggle -->
            <button
              class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors hover:scale-110"
              :class="statusDotClass(ch.status)"
              :title="'当前: ' + chStore.getStatusLabel(ch.status) + ' — 点击切换'"
              @click="cycleStatus(ch)"
            >
              <svg v-if="ch.status === 'solved'" class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
              <svg v-else-if="ch.status === 'attempting'" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4"/>
              </svg>
              <svg v-else class="w-2 h-2 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="12"/>
              </svg>
            </button>

            <!-- Name -->
            <span
              class="flex-1 text-sm font-medium truncate"
              :class="ch.status === 'solved' ? 'text-green-400' : ch.status === 'attempting' ? 'text-yellow-400' : 'text-[var(--text-primary)]'"
            >
              {{ ch.name }}
            </span>

            <!-- Status label -->
            <span
              class="text-xs px-2 py-0.5 rounded-full shrink-0"
              :class="statusLabelClass(ch.status)"
            >
              {{ chStore.getStatusLabel(ch.status) }}
            </span>

            <!-- Open folder -->
            <button
              v-if="ch.directory"
              class="w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-400/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              title="打开文件夹"
              @click="openChallengeFolder(ch.directory)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/>
              </svg>
            </button>

            <!-- Export challenge -->
            <button
              v-if="ch.directory"
              class="w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-green-400 hover:bg-green-500/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              title="导出题目文件"
              @click="exportChallenge(ch)"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
              </svg>
            </button>

            <!-- Edit -->
            <button
              class="w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              title="编辑题目"
              @click="startEdit(ch)"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>

            <!-- Delete -->
            <button
              class="w-6 h-6 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              title="删除题目"
              @click="confirmDeleteChallenge(ch)"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Add challenge button for this category -->
        <button
          class="mt-2 w-full py-1.5 rounded-lg border border-dashed border-[var(--border-color)] text-xs text-[var(--text-muted)] hover:text-blue-400 hover:border-blue-400/50 transition-colors"
          @click="openCreateDialog(category)"
        >
          + 新建题目
        </button>
      </div>

      <!-- All-category create button when no challenges exist -->
      <div v-if="Object.keys(challengeStore.byCategory).length === 0" class="card text-center py-6">
        <p class="text-sm text-[var(--text-secondary)] mb-3">还没有创建任何题目</p>
        <button class="btn-primary text-sm" @click="openCreateDialog('pwn')">
          创建第一个题目
        </button>
      </div>

      <!-- File sections -->
      <div>
        <div class="flex items-center gap-2 mb-4">
          <h3 class="font-semibold text-lg">附件与笔记</h3>
          <span class="text-xs text-[var(--text-muted)] font-mono">{{ competition.directory }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- PWN section -->
          <div class="card">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <svg class="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <h4 class="font-semibold text-sm">PWN</h4>
              </div>
              <span class="text-xs text-[var(--text-muted)]">{{ fileCounts.pwn }} 文件</span>
            </div>
            <div v-if="pwnFiles.length === 0" class="text-xs text-[var(--text-muted)] py-2">
              暂无附件 — 拖拽文件到此处或使用文件管理器导入
            </div>
            <div v-else class="space-y-1">
              <div
                v-for="file in pwnFiles"
                :key="file.path"
                class="flex items-center gap-2 py-1 px-2 rounded text-xs hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group/file"
              >
                <svg class="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span class="truncate flex-1">{{ file.name }}</span>
                <span class="text-[var(--text-muted)] shrink-0 opacity-0 group-hover/file:opacity-100">
                  {{ formatSize(file.size) }}
                </span>
              </div>
            </div>
          </div>

          <!-- RE section -->
          <div class="card">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                  </svg>
                </div>
                <h4 class="font-semibold text-sm">RE</h4>
              </div>
              <span class="text-xs text-[var(--text-muted)]">{{ fileCounts.re }} 文件</span>
            </div>
            <div v-if="reFiles.length === 0" class="text-xs text-[var(--text-muted)] py-2">
              暂无附件 — 拖拽文件到此处或使用文件管理器导入
            </div>
            <div v-else class="space-y-1">
              <div
                v-for="file in reFiles"
                :key="file.path"
                class="flex items-center gap-2 py-1 px-2 rounded text-xs hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group/file"
              >
                <svg class="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span class="truncate flex-1">{{ file.name }}</span>
                <span class="text-[var(--text-muted)] shrink-0 opacity-0 group-hover/file:opacity-100">
                  {{ formatSize(file.size) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Notes section -->
          <div class="card">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <svg class="w-3.5 h-3.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </div>
                <h4 class="font-semibold text-sm">笔记</h4>
              </div>
              <span class="text-xs text-[var(--text-muted)]">{{ fileCounts.notes }} 文件</span>
            </div>
            <div v-if="notesFiles.length === 0" class="text-xs text-[var(--text-muted)] py-2">
              暂无笔记 — 点击新建或在编辑器中创建 .md 文件
            </div>
            <div v-else class="space-y-1">
              <div
                v-for="file in notesFiles"
                :key="file.path"
                class="flex items-center gap-2 py-1 px-2 rounded text-xs hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group/file"
                @click="openInEditor(file)"
              >
                <svg class="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span class="truncate flex-1">{{ file.name }}</span>
                <span class="text-blue-400 text-xs shrink-0 opacity-0 group-hover/file:opacity-100">
                  编辑 ↗
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Not participating hint -->
    <div v-else class="card text-center py-8">
      <div class="text-4xl mb-3">
        <svg class="w-8 h-8 mx-auto text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <p class="text-sm text-[var(--text-secondary)] mb-1">尚未参加此比赛</p>
      <p class="text-xs text-[var(--text-muted)] mb-4">参加后将自动创建 PWN / RE / 笔记 目录结构</p>
      <button
        v-if="competition.status !== 'finished'"
        class="btn-primary"
        @click="handleParticipate"
      >
        参加此比赛
      </button>
    </div>

    <!-- ─── Create / Edit Challenge Modal ─── -->
    <Teleport to="body">
      <div
        v-if="showChallengeDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showChallengeDialog = false"
      >
        <div class="card w-96 space-y-4">
          <h3 class="font-semibold text-lg">{{ editingChallenge ? '编辑题目' : '新建题目' }}</h3>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-[var(--text-muted)] block mb-1">题目名称</label>
              <input
                v-model="challengeForm.name"
                class="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-blue-400 transition-colors"
                placeholder="如 baby-bof"
                @keyup.enter="submitChallenge"
              />
            </div>
            <div>
              <label class="text-xs text-[var(--text-muted)] block mb-1">分类</label>
              <select
                v-model="challengeForm.category"
                class="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-blue-400 transition-colors"
              >
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <button class="btn-secondary text-xs px-4 py-1.5" @click="showChallengeDialog = false">取消</button>
            <button
              class="btn-primary text-xs px-4 py-1.5"
              :disabled="!challengeForm.name.trim()"
              @click="submitChallenge"
            >
              {{ editingChallenge ? '保存' : '创建' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ─── Delete Challenge Confirmation ─── -->
    <Teleport to="body">
      <div
        v-if="deleteTarget"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="deleteTarget = null"
      >
        <div class="card w-96 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <div>
              <p class="font-medium text-sm">删除题目「{{ deleteTarget.name }}」</p>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">题目文件夹及内容将一并删除。此操作不可撤销。</p>
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <button class="btn-secondary text-xs px-4 py-1.5" @click="deleteTarget = null">取消</button>
            <button
              class="bg-red-500 hover:bg-red-600 text-white text-xs px-4 py-1.5 rounded-lg transition-colors"
              @click="executeDeleteChallenge"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>

  <!-- Loading / Not found -->
  <div v-else-if="loading" class="flex items-center justify-center py-20">
    <svg class="w-6 h-6 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  </div>
  <div v-else class="text-center py-20 text-[var(--text-muted)] text-sm">
    比赛未找到
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCompetitionsStore } from '@/stores/competitions'
import { useChallengesStore } from '@/stores/challenges'
import { getDuration, formatSize, statusBadgeClass, statusLabel } from '@/utils/formatters'
import type { Competition, FileEntry, Challenge } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useCompetitionsStore()
const chStore = useChallengesStore()

const loading = ref(true)
const competition = ref<Competition | null>(null)
const dirFiles = ref<Record<string, FileEntry[]>>({ pwn: [], re: [], notes: [] })

// Challenge dialog state
const showChallengeDialog = ref(false)
const editingChallenge = ref<Challenge | null>(null)
const challengeForm = ref({ name: '', category: 'pwn' })
const deleteTarget = ref<Challenge | null>(null)

const categories = ['pwn', 're', 'web', 'crypto', 'misc']

const pwnFiles = computed(() => dirFiles.value.pwn)
const reFiles = computed(() => dirFiles.value.re)
const notesFiles = computed(() => dirFiles.value.notes)

const fileCounts = computed(() => ({
  pwn: pwnFiles.value.length,
  re: reFiles.value.length,
  notes: notesFiles.value.length
}))

const progress = computed(() => {
  if (!competition.value) return { total: 0, solved: 0, percent: 0 }
  return chStore.getCompProgress(competition.value.id)
})

onMounted(async () => {
  await loadCompetition()
})

watch(() => route.params.id, async () => {
  await loadCompetition()
})

async function loadCompetition() {
  loading.value = true
  const id = Number(route.params.id)

  try {
    const detail = await window.api.competitions.getDetail(id)
    if (detail) {
      competition.value = detail
    } else {
      competition.value = store.getById(id) || null
    }

    if (competition.value) {
      // Load challenges
      await chStore.loadByCompetition(competition.value.id)

      // Load directory files if participating
      if (competition.value.directory) {
        await loadDirectoryFiles(competition.value.directory)
      }
    }
  } catch {
    competition.value = store.getById(id) || null
  } finally {
    loading.value = false
  }
}

async function loadDirectoryFiles(baseDir: string) {
  for (const sub of ['pwn', 're', 'notes']) {
    try {
      const files = await window.api.files.readDir(`${baseDir}/${sub}`)
      dirFiles.value[sub] = files || []
    } catch {
      dirFiles.value[sub] = []
    }
  }
}

async function handleParticipate() {
  if (!competition.value) return
  await store.participate(competition.value.id)
  await loadCompetition()
}

// ── Challenge operations ──

function openCreateDialog(category: string) {
  editingChallenge.value = null
  challengeForm.value = { name: '', category }
  showChallengeDialog.value = true
}

function startEdit(ch: Challenge) {
  editingChallenge.value = ch
  challengeForm.value = { name: ch.name, category: ch.category }
  showChallengeDialog.value = true
}

async function submitChallenge() {
  if (!competition.value || !challengeForm.value.name.trim()) return

  if (editingChallenge.value) {
    await chStore.update(editingChallenge.value.id, {
      name: challengeForm.value.name.trim(),
      category: challengeForm.value.category
    })
  } else {
    await chStore.create(
      competition.value.id,
      challengeForm.value.name.trim(),
      challengeForm.value.category
    )
  }

  showChallengeDialog.value = false
  // Reload files if needed
  if (!editingChallenge.value && competition.value?.directory) {
    await loadDirectoryFiles(competition.value.directory)
  }
}

async function cycleStatus(ch: Challenge) {
  const next = chStore.nextStatus(ch.status)
  await chStore.updateStatus(ch.id, next)
  // Reload competition to get updated solved field
  if (competition.value) {
    const detail = await window.api.competitions.getDetail(competition.value.id)
    if (detail) competition.value = detail
  }
}

function confirmDeleteChallenge(ch: Challenge) {
  deleteTarget.value = ch
}

async function executeDeleteChallenge() {
  if (!deleteTarget.value) return
  await chStore.deleteChallenge(deleteTarget.value.id)
  deleteTarget.value = null
  // Reload competition to get updated solved field
  if (competition.value) {
    const detail = await window.api.competitions.getDetail(competition.value.id)
    if (detail) competition.value = detail
    // Reload files
    if (competition.value.directory) {
      await loadDirectoryFiles(competition.value.directory)
    }
  }
}

function openChallengeFolder(dirPath: string) {
  window.api.app.openExternal('file:///' + dirPath.replace(/\\/g, '/'))
}

// ── Export ──

async function exportCompetition() {
  if (!competition.value) return
  try {
    await window.api.export_.competition(competition.value.id, competition.value.name, true)
  } catch (err) {
    console.error('Export failed:', err)
  }
}

async function exportChallenge(ch: Challenge) {
  if (!ch.directory) return
  try {
    await window.api.export_.challenge(ch.directory, ch.name, true)
  } catch (err) {
    console.error('Export failed:', err)
  }
}

// ── Styling helpers ──

function statusDotClass(status: string): string {
  switch (status) {
    case 'solved': return 'bg-green-500'
    case 'attempting': return 'bg-yellow-500'
    default: return 'bg-slate-600 border border-slate-500'
  }
}

function statusLabelClass(status: string): string {
  switch (status) {
    case 'solved': return 'bg-green-500/15 text-green-400'
    case 'attempting': return 'bg-yellow-500/15 text-yellow-400'
    default: return 'bg-slate-500/15 text-slate-400'
  }
}

// ── File helpers ──

function openInEditor(file: FileEntry) {
  router.push(`/editor/notes/${file.path}`)
}

function formatDateRange(startStr: string, endStr: string): string {
  if (!startStr) return '—'
  const start = new Date(startStr)
  const end = endStr ? new Date(endStr) : null
  const fmt = (d: Date) => d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  if (!end) return fmt(start)
  return `${fmt(start)} → ${fmt(end)}`
}

function formatFullDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
