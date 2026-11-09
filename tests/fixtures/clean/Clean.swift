import SwiftUI
struct V: View { var body: some View {
  Button {
    go()
  } label: {
    Image(systemName: "plus").frame(width: 20, height: 20).padding(12)
  }
  .accessibilityLabel("Add")
}}
