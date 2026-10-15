import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UIWindowSceneDelegate {
  var window: UIWindow?

  private var reactNativeDelegate: ReactNativeDelegate?
  private var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    makeFactory()
    return true
  }

  // UIScene lifecycle: this runtime traps when an app declares a scene but never adopts
  // it, so React Native renders into the scene's window rather than a window created in
  // application(_:didFinishLaunchingWithOptions:).
  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    // The scene can connect before didFinishLaunching has finished on this runtime, so
    // build the factory here too rather than assuming it already exists.
    if reactNativeFactory == nil {
      makeFactory()
    }

    guard let windowScene = scene as? UIWindowScene else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window

    reactNativeFactory?.startReactNative(
      withModuleName: "assessment",
      in: window,
      launchOptions: nil
    )

    window.makeKeyAndVisible()
  }

  private func makeFactory() {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}