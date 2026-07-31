import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../core/config/app_config.dart';
import '../../data/services/api_client.dart';

/// Real-time chat service using Socket.IO.
///
/// Connects to the backend Socket.IO server for real-time messaging.
class ChatService {
  ChatService(this._ref);

  final Ref _ref;
  io.Socket? _socket;
  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();

  /// Stream of incoming messages.
  Stream<Map<String, dynamic>> get messageStream => _messageController.stream;

  /// Stream of connection status changes.
  Stream<bool> get connectionStream => _connectionController.stream;

  /// Whether the socket is connected.
  bool get isConnected => _socket?.connected ?? false;

  /// Connect to the Socket.IO server.
  void connect() {
    if (_socket != null && _socket!.connected) return;

    final token = _ref.read(authTokenProvider);

    _socket = io.io(AppConfig.socketUrl, io.OptionBuilder()
        .setTransports(['websocket'])
        .disableAutoConnect()
        .setExtraHeaders({'Authorization': 'Bearer $token'})
        .build());

    _socket!.onConnect((_) {
      debugPrint('[Chat] Connected');
      _connectionController.add(true);
    });

    _socket!.onDisconnect((_) {
      debugPrint('[Chat] Disconnected');
      _connectionController.add(false);
    });

    _socket!.onConnectError((err) {
      debugPrint('[Chat] Connect error: $err');
      _connectionController.add(false);
    });

    _socket!.on('message', (data) {
      _messageController.add(data as Map<String, dynamic>);
    });

    _socket!.on('typing', (data) {
      _messageController.add({'type': 'typing', ...data as Map<String, dynamic>});
    });

    _socket!.connect();
  }

  /// Join a conversation room.
  void joinConversation(int conversationId) {
    _socket?.emit('join', {'conversationId': conversationId});
  }

  /// Leave a conversation room.
  void leaveConversation(int conversationId) {
    _socket?.emit('leave', {'conversationId': conversationId});
  }

  /// Send a message via socket.
  void sendMessage(int conversationId, String content) {
    _socket?.emit('message', {
      'conversationId': conversationId,
      'content': content,
    });
  }

  /// Send typing indicator.
  void sendTyping(int conversationId, bool isTyping) {
    _socket?.emit('typing', {
      'conversationId': conversationId,
      'isTyping': isTyping,
    });
  }

  /// Disconnect from the server.
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _connectionController.close();
  }
}

final chatServiceProvider = Provider<ChatService>((ref) {
  final service = ChatService(ref);
  ref.onDispose(service.dispose);
  return service;
});
