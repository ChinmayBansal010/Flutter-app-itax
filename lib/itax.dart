import 'package:flutter/material.dart';

class ItaxPage extends StatefulWidget {
  const ItaxPage({super.key});

  @override
  State<ItaxPage> createState() => _ItaxPageState();
}

class _ItaxPageState extends State<ItaxPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home Page'),
        backgroundColor: Colors.blue,
      ),
      body: const Center(
        child: Text(
          'Welcome',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
