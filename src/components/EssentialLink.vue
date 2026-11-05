<template>
  <div class="sidebar-menu-shell">
    <q-list class="sidebar-menu-list">
      <div v-for="(link, index) in filteredLinks" :key="index">
        <q-item
          v-if="!link.children"
          clickable
          :to="{ name: link.link }"
          class="sidebar-link-item"
          :class="{ 'selected-link': route.name === link.link, 'sidebar-link-item--mini': mini }"
          active-class="navbar-active"
        >
          <q-item-section avatar class="sidebar-link-avatar">
            <q-icon :name="link.icon || 'chevron_right'" size="19px" />
          </q-item-section>
          <q-item-section v-if="!mini">
            <q-item-label class="sidebar-link-label">{{ link?.title }}</q-item-label>
          </q-item-section>
          <q-tooltip v-if="mini" anchor="center right" self="center left" :offset="[10, 0]">
            {{ link?.title }}
          </q-tooltip>
        </q-item>

        <q-item
          v-else-if="link.children && mini"
          clickable
          class="sidebar-link-item sidebar-link-item--mini"
          :class="{ 'selected-link': isGroupActive(link) }"
        >
          <q-item-section avatar class="sidebar-link-avatar">
            <q-icon :name="link.icon || 'folder'" size="19px" />
          </q-item-section>
          <q-tooltip anchor="center right" self="center left" :offset="[10, 0]">
            {{ link?.title }}
          </q-tooltip>
          <q-menu anchor="top end" self="top start" :offset="[8, 0]">
            <q-list style="min-width: 200px">
              <q-item-label header>{{ link.title }}</q-item-label>
              <template v-for="(son, sIdx) in link.children" :key="sIdx">
                <q-item
                  v-if="!son.children"
                  clickable
                  v-close-popup
                  :to="{ name: son.link }"
                  :active="route.name === son.link"
                >
                  <q-item-section avatar>
                    <q-icon :name="son.icon" color="primary" />
                  </q-item-section>
                  <q-item-section>{{ son.title }}</q-item-section>
                </q-item>
                <template v-else>
                  <q-item-label header class="text-caption">{{ son.title }}</q-item-label>
                  <q-item
                    v-for="(son1, gIdx) in son.children"
                    :key="gIdx"
                    clickable
                    v-close-popup
                    :to="{ name: son1.link }"
                    :active="route.name === son1.link"
                  >
                    <q-item-section avatar>
                      <q-icon :name="son1.icon" color="primary" />
                    </q-item-section>
                    <q-item-section>{{ son1.title }}</q-item-section>
                  </q-item>
                </template>
              </template>
            </q-list>
          </q-menu>
        </q-item>

        <q-expansion-item
          v-else-if="link.children"
          group="man"
          class="sidebar-expansion"
          :content-inset-level="0"
          :icon="link.icon"
          :label="link?.title"
          header-class="sidebar-expansion-header"
          expand-icon-class="sidebar-expand-icon"
        >
          <div v-for="(son, index) in link.children" :key="index">
            <q-item
              v-if="!son.children"
              :to="{ name: son.link }"
              v-ripple
              clickable
              class="sidebar-child-item"
              :class="{ 'selected-link': route.name === son.link }"
            >
              <q-item-section avatar class="sidebar-link-avatar">
                <q-icon size="18px" :name="son.icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="sidebar-child-label">{{ son?.title }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-expansion-item
              v-if="son.children"
              group="manp"
              class="sidebar-expansion sidebar-expansion-nested"
              :content-inset-level="0"
              :icon="son.icon"
              :label="son?.title"
              header-class="sidebar-expansion-header nested-header"
              expand-icon-class="sidebar-expand-icon"
            >
              <div v-for="(son1, index) in son.children" :key="index">
                <q-item
                  v-if="!son1.children"
                  :to="{ name: son1.link }"
                  v-ripple
                  clickable
                  class="sidebar-grandchild-item"
                  :class="{ 'selected-link': route.name === son1.link }"
                >
                  <q-item-section avatar class="sidebar-link-avatar">
                    <q-icon size="18px" :name="son1.icon" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="sidebar-child-label">{{ son1?.title }}</q-item-label>
                  </q-item-section>
                </q-item>
              </div>
            </q-expansion-item>
          </div>
        </q-expansion-item>
      </div>
    </q-list>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { essentialListUrl } from 'src/assets/js/util/essentialListUrl'
import { useRoute } from 'vue-router'
import { useAuthStore } from 'src/stores/auth-store'

const route = useRoute()
const authStore = useAuthStore()

defineProps({
  mini: { type: Boolean, default: false },
})

function canAccess(permission) {
  if (!permission) {
    return false
  }

  if (Array.isArray(permission)) {
    return authStore.hasAnyPermission(permission)
  }

  return authStore.hasPermission(permission)
}

function isGroupActive(link) {
  if (!link?.children?.length) return false
  return link.children.some((son) => {
    if (son.link && route.name === son.link) return true
    return son.children?.some((g) => g.link && route.name === g.link)
  })
}

/**
 * Filter links based on user permissions.
 */
const filteredLinks = computed(() => {
  return essentialListUrl
    .map(link => ({ ...link })) // Create shallow copy
    .filter(link => {
      // If no permission is defined, don't show the link
      if (!link.permission) {
        return false
      }

      // Check if user has permission
      if (!canAccess(link.permission)) {
        return false
      }

      // If link has children, filter them too
      if (link.children) {
        const filteredChildren = link.children
          .map(child => ({ ...child })) // Create shallow copy
          .filter(child => {
            // If no permission is defined, don't show the child
            if (!child.permission) {
              return false
            }

            // Check if user has permission
            if (!canAccess(child.permission)) {
              return false
            }

            // Filter nested children
            if (child.children) {
              const filteredGrandchildren = child.children
                .map(grandchild => ({ ...grandchild })) // Create shallow copy
                .filter(grandchild => {
                  // If no permission is defined, don't show the grandchild
                  if (!grandchild.permission) {
                    return false
                  }

                  // Check if user has permission
                  return canAccess(grandchild.permission)
                })

              // Update children with filtered grandchildren
              child.children = filteredGrandchildren

              // If no visible grandchildren, don't show this child
              if (filteredGrandchildren.length === 0) {
                return false
              }
            }

            return true
          })

        // Update children with filtered list
        link.children = filteredChildren

        // Only show parent if it has visible children
        if (filteredChildren.length === 0) {
          return false
        }
      }

      return true
    })
})
</script>

<style scoped>
.sidebar-menu-shell {
  width: 100%;
  padding-top: 2px;
}

.sidebar-menu-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-link-item,
.sidebar-child-item,
.sidebar-grandchild-item,
.sidebar-expansion :deep(.sidebar-expansion-header) {
  position: relative;
  min-height: 44px;
  border-radius: 10px;
  color: var(--app-sidebar-text);
  background: transparent;
  transition: background 0.2s ease, color 0.2s ease;
}

.sidebar-link-item,
.sidebar-child-item,
.sidebar-grandchild-item {
  padding: 0 12px;
}

.sidebar-expansion :deep(.sidebar-expansion-header) {
  padding: 0 12px;
}

.sidebar-child-item {
  padding-left: 22px;
  min-height: 40px;
}

.sidebar-grandchild-item {
  padding-left: 34px;
  min-height: 38px;
}

.sidebar-link-item:hover,
.sidebar-child-item:hover,
.sidebar-grandchild-item:hover,
.sidebar-expansion :deep(.sidebar-expansion-header:hover) {
  background: var(--app-sidebar-hover);
}

.sidebar-link-item :deep(.q-focus-helper),
.sidebar-child-item :deep(.q-focus-helper),
.sidebar-grandchild-item :deep(.q-focus-helper),
.sidebar-expansion :deep(.sidebar-expansion-header .q-focus-helper) {
  display: none;
}

.sidebar-link-avatar,
.sidebar-expansion :deep(.sidebar-expansion-header .q-item__section--avatar) {
  min-width: 32px;
  color: var(--app-sidebar-muted);
  transition: color 0.2s ease;
}

.sidebar-link-label,
.sidebar-child-label,
.sidebar-expansion :deep(.sidebar-expansion-header .q-item__label) {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--app-sidebar-text);
}

.sidebar-child-label {
  font-size: 0.86rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: none;
}

.sidebar-expansion {
  border-radius: 12px;
  overflow: hidden;
}

.sidebar-expansion :deep(.sidebar-expand-icon) {
  color: var(--app-sidebar-muted);
}

.sidebar-expansion :deep(.q-expansion-item__content) {
  position: relative;
  margin-left: 22px;
  padding: 2px 0 6px;
  border-left: 1px solid rgba(var(--maia-gold-light-rgb), 0.22);
}

.sidebar-expansion-nested {
  margin-left: 8px;
}

.navbar-active,
.selected-link {
  background: var(--app-sidebar-active) !important;
  box-shadow: inset 3px 0 0 var(--maia-gold-light), 0 6px 16px rgba(0, 0, 0, 0.18);
}

.navbar-active .sidebar-link-label,
.selected-link .sidebar-link-label,
.navbar-active .sidebar-child-label,
.selected-link .sidebar-child-label {
  color: #ffffff !important;
}

.navbar-active .sidebar-link-avatar,
.selected-link .sidebar-link-avatar {
  color: var(--maia-gold-bright) !important;
}

.sidebar-link-item--mini,
.sidebar-expansion--mini :deep(.sidebar-expansion-header) {
  justify-content: center;
  padding: 0;
  min-height: 44px;
}

.sidebar-link-item--mini .sidebar-link-avatar,
.sidebar-expansion--mini :deep(.sidebar-expansion-header .q-item__section--avatar) {
  min-width: 0;
  padding: 0;
  margin: 0;
}

.sidebar-expansion--mini :deep(.q-expansion-item__content) {
  margin-left: 0;
  border-left: none;
  padding: 0;
}

.sidebar-expansion--mini .sidebar-child-item {
  padding-left: 0;
  justify-content: center;
}

.sidebar-expansion--mini .sidebar-child-item .sidebar-child-label {
  display: none;
}
</style>
