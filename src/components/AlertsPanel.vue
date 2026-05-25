<template>
  <section class="panel alerts-panel">
    <div class="panel__header">
      <div>
        <h2>当前告警</h2>
        <p>按严重程度展示线上异常摘要</p>
      </div>
    </div>
    <div class="alerts-list">
      <article v-for="alert in alerts" :key="alert.id" class="alert-item" :class="`alert-item--${alert.severity}`">
        <div class="alert-item__main">
          <el-tag :type="tagType(alert.severity)" effect="light">{{ severityText(alert.severity) }}</el-tag>
          <div>
            <h3>{{ alert.title }}</h3>
            <p>{{ alert.message }}</p>
          </div>
        </div>
        <div class="alert-item__meta">
          <span>{{ alert.source }}</span>
          <span>{{ formatTime(alert.occurredAt) }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AlertItem } from '../types/dashboard';

defineProps<{
  alerts: AlertItem[];
}>();

function tagType(severity: AlertItem['severity']) {
  return {
    info: 'primary',
    warning: 'warning',
    critical: 'danger',
  }[severity];
}

function severityText(severity: AlertItem['severity']) {
  return {
    info: '提示',
    warning: '告警',
    critical: '严重',
  }[severity];
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
</script>
