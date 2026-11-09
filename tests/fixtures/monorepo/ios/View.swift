import SwiftUI
struct V: View { var body: some View {
  Button(action: {}) { Image(systemName: "trash") }
    .frame(width: 30, height: 30)
  Text("Hola").font(.system(size: 13))
  Image("x").onTapGesture { go() }
}}
