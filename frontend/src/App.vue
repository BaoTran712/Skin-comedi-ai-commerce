<script setup>
import { Notivue, Notification, NotificationProgress, NotivueSwipe } from 'notivue';
import Chatbox from './components/Chatbox.vue';
</script>

<template>
  <Notivue v-slot=" item ">
    <NotivueSwipe :item=" item ">
      <Notification :item=" item ">
        <NotificationProgress :item=" item " />
      </Notification>
    </NotivueSwipe>
  </Notivue>

  <RouterView></RouterView>
  <Chatbox />
</template>
