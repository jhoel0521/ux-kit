import SwiftUI
struct V: View { var body: some View {
  Button(action: { vm.delete() }) { Image(systemName: "trash") }
  Button {
    go()
  } label: {
    Image(systemName: "plus")
  }
  Button {
    go()
  } label: {
    Text("Go").frame(width: 20, height: 20)
  }.padding(12)
}}
