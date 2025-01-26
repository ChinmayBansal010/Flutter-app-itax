class SharedData {
  static final SharedData _instance = SharedData._internal();
  SharedData._internal();
  factory SharedData() => _instance;

  String userPlace = '';
}

final sharedData = SharedData();
